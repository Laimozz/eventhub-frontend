import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../features/auth/api/auth-api'
import { authErrorMessage } from '../features/auth/api/auth-errors'
import { AuthContext } from '../features/auth/hooks/useAuth'
import type { LoginRequest, User } from '../features/auth/types/auth'
import { useNavigate } from 'react-router'
import { ApiError, onSessionExpired } from '../lib/http-client'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const currentUserRef = useRef<User | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')

  useEffect(
    () =>
      onSessionExpired(() => {
        if (!currentUserRef.current) return
        currentUserRef.current = null
        setUser(null)
        setSessionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        navigate('/login', { replace: true })
      }),
    [navigate],
  )

  useEffect(() => {
    let active = true
    authApi
      .refreshSession()
      .then((currentUser) => {
        if (active) {
          currentUserRef.current = currentUser
          setUser(currentUser)
        }
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          setSessionError(authErrorMessage(error))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function signIn(body: LoginRequest) {
    const currentUser = await authApi.login(body)
    currentUserRef.current = currentUser
    setUser(currentUser)
    setSessionError('')
  }

  async function signOut() {
    await authApi.logout()
    currentUserRef.current = null
    setUser(null)
    setSessionError('')
  }

  return (
    <AuthContext.Provider value={{ user, loading, sessionError, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
