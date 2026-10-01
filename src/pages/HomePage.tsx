import { useState } from 'react'
import { useNavigate } from 'react-router'
import { authErrorMessage } from '../features/auth/api/auth-errors'
import { useAuth } from '../features/auth/hooks/useAuth'
import styles from './HomePage.module.css'

export function HomePage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (cause) {
      setError(authErrorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className={styles.page}>
      <button className={styles.button} onClick={handleLogout} disabled={pending}>{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </main>
  )
}
