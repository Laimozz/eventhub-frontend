import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Eye, EyeOff, LockKeyhole, Mail, Ticket } from 'lucide-react'
import { authErrorMessage } from '../api/auth-errors'
import { useAuth } from '../hooks/useAuth'
import styles from './AuthPage.module.css'

const currentYear = new Date().getFullYear()

export function LoginPage() {
  const { signIn, sessionError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const registered = location.state?.registered === true
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError('')
    if (!password.trim() || new TextEncoder().encode(password).length > 72) {
      setError('Mật khẩu không được để trống hoặc vượt quá 72 byte UTF-8.')
      return
    }
    setPending(true)
    try {
      await signIn({ email: email.trim().toLowerCase(), password })
      navigate('/', { replace: true })
    } catch (cause) {
      setError(authErrorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/login" aria-label="EventHub — Đăng nhập">
          <span className={styles.brand} aria-label="EventHub">
            <span className={styles.mark}>
              <Ticket aria-hidden="true" size={21} />
            </span>
            <span>
              Event<span className={styles.accent}>Hub</span>
            </span>
          </span>
        </Link>
        <nav aria-label="Tài khoản">
          <Link to="/register">Đăng ký</Link>
          <Link to="/login" className={styles.loginLink}>
            Đăng nhập
          </Link>
        </nav>
      </header>
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="auth-title">
          <div className={styles.heading}>
            <span className={styles.compact} aria-label="EventHub">
              <span className={styles.mark}>
                <Ticket aria-hidden="true" size={28} />
              </span>
            </span>
            <h1 id="auth-title">Đăng nhập</h1>
            <p>Chào mừng bạn trở lại với EventHub!</p>
          </div>
          {registered && (
            <p className={`${styles.notice} ${styles.success}`} role="status">
              Đăng ký thành công! Hãy đăng nhập để tiếp tục.
            </p>
          )}
          <form className={styles.form} onSubmit={handleSubmit} aria-busy={pending}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="email">
                  Email<span className={styles.required}> *</span>
                </label>
              </div>
              <div className={styles.control}>
                <span className={styles.icon}>
                  <Mail size={17} aria-hidden="true" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  autoComplete="username"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={pending}
                />
              </div>
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password">
                  Mật khẩu<span className={styles.required}> *</span>
                </label>
              </div>
              <div className={styles.control}>
                <span className={styles.icon}>
                  <LockKeyhole size={17} aria-hidden="true" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                />
                <button
                  type="button"
                  className={styles.toggle}
                  disabled={pending}
                  aria-label={`${showPassword ? 'Ẩn' : 'Hiện'} mật khẩu`}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {(error || sessionError) && (
              <p className={styles.notice} role="alert">
                {error || sessionError}
              </p>
            )}
            <button
              type="submit"
              className={`${styles.button} ${styles.submit}`}
              disabled={pending}
            >
              {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
          <p className={styles.switch}>
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>© {currentYear} EventHub. Nền tảng kết nối sự kiện.</span>
        <span>Khám phá sự kiện. Kết nối đam mê.</span>
      </footer>
    </div>
  )
}
