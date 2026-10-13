import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../features/auth/hooks/useAuth'
import { getUnreadCount, notificationStreamUrl } from '../features/notifications/api/notifications-api'
import { NotificationsContext } from '../features/notifications/hooks/useNotifications'

const emptyState = { unreadCount: 0, revision: 0, refresh: async () => {} }

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user && user.role !== 'STAFF'
    ? <NotificationSession key={user.id}>{children}</NotificationSession>
    : <NotificationsContext.Provider value={emptyState}>{children}</NotificationsContext.Provider>
}

function NotificationSession({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [revision, setRevision] = useState(0)
  const active = useRef(true)
  const requestId = useRef(0)
  const requestController = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    try {
      const count = await getUnreadCount(controller.signal)
      if (active.current && id === requestId.current) {
        setUnreadCount(count)
        setRevision(value => value + 1)
      }
    } catch (cause) {
      if (!controller.signal.aborted) throw cause
    }
  }, [])

  const cancelRefresh = useCallback(() => {
    requestId.current++
    requestController.current?.abort()
  }, [])

  useEffect(() => {
    active.current = true
    let stopped = false
    let source: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let retryDelay = 1_000

    function retry() {
      source?.close()
      if (stopped) return
      clearTimeout(retryTimer)
      retryTimer = setTimeout(() => { void connect() }, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30_000)
    }

    async function connect() {
      try {
        // REST uses the shared 401/refresh interceptor before reconnecting SSE with cookies.
        await refresh()
        if (stopped) return
        source = new EventSource(notificationStreamUrl(), { withCredentials: true })
        source.onopen = () => {
          retryDelay = 1_000
          // Also fetch after connecting to cover changes during the connection gap.
          void refresh().catch(retry)
        }
        source.addEventListener('notifications-changed', () => { void refresh().catch(retry) })
        source.onerror = retry
      } catch {
        retry()
      }
    }

    void connect()
    return () => {
      stopped = true
      active.current = false
      cancelRefresh()
      clearTimeout(retryTimer)
      source?.close()
    }
  }, [refresh, cancelRefresh])

  return <NotificationsContext.Provider value={{ unreadCount, revision, refresh }}>{children}</NotificationsContext.Provider>
}
