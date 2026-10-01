import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
  }
}

type SessionRequest = InternalAxiosRequestConfig & {
  retriedAfterRefresh?: boolean
  tokenVersion?: number
  sessionEpoch?: number
}

export const httpClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, ''),
  withCredentials: true,
  timeout: 15_000,
  headers: { 'X-CSRF-Protection': '1' },
})

let tokenVersion = 0
let sessionEpoch = 0
let sessionExpired = false
let pendingRefresh: Promise<unknown> | null = null
const expiredListeners = new Set<() => void>()

export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener)
  return () => {
    expiredListeners.delete(listener)
  }
}

function expireSession() {
  if (sessionExpired) return
  sessionExpired = true
  sessionEpoch++
  expiredListeners.forEach((listener) => listener())
}

function authEndpoint(config: InternalAxiosRequestConfig): string | undefined {
  const path = new URL(httpClient.getUri(config), window.location.origin).pathname
  return /\/auth\/(login|register|refresh|logout)\/?$/.exec(path)?.[1]
}

httpClient.interceptors.request.use(async (config: SessionRequest) => {
  // Finish rotation before changing accounts or revoking the latest session.
  const endpoint = authEndpoint(config)
  if ((endpoint === 'login' || endpoint === 'logout') && pendingRefresh) {
    await pendingRefresh.catch(() => undefined)
  }
  config.tokenVersion = tokenVersion
  config.sessionEpoch = sessionEpoch
  return config
})

httpClient.interceptors.response.use(
  (response) => {
    const endpoint = authEndpoint(response.config)
    if (endpoint === 'login' || endpoint === 'logout') {
      sessionEpoch++
      tokenVersion++
      sessionExpired = endpoint === 'logout'
    }
    return response
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error
    const config = error.config as SessionRequest | undefined
    const status = error.response?.status
    if (status !== 401 || !config || authEndpoint(config)) {
      throw status ? new ApiError(status) : error
    }
    // Ignore old requests after logout or a different login.
    if (sessionExpired || config.sessionEpoch !== sessionEpoch) throw new ApiError(401)
    if (config.retriedAfterRefresh) {
      expireSession()
      throw new ApiError(401)
    }
    config.retriedAfterRefresh = true
    // A late 401 may belong to a request sent before another request refreshed.
    if (config.tokenVersion === tokenVersion) await refreshSession()
    if (sessionExpired || config.sessionEpoch !== sessionEpoch) throw new ApiError(401)
    return httpClient.request(config)
  },
)

// Used both on application startup and by the 401 interceptor.
export function refreshSession<T = unknown>(): Promise<T> {
  if (!pendingRefresh) {
    const epoch = sessionEpoch
    pendingRefresh = httpClient
      .post('/auth/refresh')
      .then((response) => {
        if (epoch !== sessionEpoch) throw new ApiError(401)
        tokenVersion++
        sessionExpired = false
        return response.data as unknown
      })
      .catch((error: unknown) => {
        if (epoch === sessionEpoch && error instanceof ApiError && error.status === 401) {
          expireSession()
        }
        // A network error or 5xx is not proof that the refresh token expired.
        throw error
      })
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh as Promise<T>
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await httpClient.post<T>(path, body)
  return response.data
}
