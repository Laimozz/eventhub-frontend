import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Ticket,
  UserRound,
} from 'lucide-react'
import { register } from '../api/auth-api'
import { authErrorMessage } from '../api/auth-errors'
import type { RegistrationRole } from '../types/auth'
import styles from './AuthPage.module.css'

const currentYear = new Date().getFullYear()

export function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<RegistrationRole>('CUSTOMER')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError('')
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên.'
    if (!password.trim() || password.length < 8)
      errors.password = 'Mật khẩu cần ít nhất 8 ký tự, không được chỉ chứa khoảng trắng.'
    if (new TextEncoder().encode(password).length > 72)
      errors.password =
        'Mật khẩu không được vượt quá 72 byte UTF-8. Ký tự có dấu có thể chiếm nhiều byte.'
    if (password !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.'
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setPending(true)
    try {
      await register({
        role,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
      })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (cause) {
      setError(authErrorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.layout}>
      <main className={`${styles.main} ${styles.registration}`}>
        <section className={`${styles.card} ${styles.wide}`} aria-labelledby="auth-title">
          <div className={styles.heading}>
            <span className={styles.compact} aria-label="EventHub">
              <span className={styles.mark}>
                <Ticket aria-hidden="true" size={28} />
              </span>
            </span>
            <h1 id="auth-title">Đăng ký tài khoản</h1>
            <p>Tạo tài khoản để săn vé sự kiện hot và nhận đặc quyền thành viên</p>
          </div>
          <form
            className={`${styles.form} ${styles.register}`}
            onSubmit={handleSubmit}
            aria-busy={pending}
          >
            <fieldset className={styles.roles} disabled={pending}>
              <legend>
                Loại tài khoản <span>*</span>
              </legend>
              <div className={styles.roleOptions}>
                <label className={styles.roleOption}>
                  <input
                    type="radio"
                    name="role"
                    value="CUSTOMER"
                    checked={role === 'CUSTOMER'}
                    onChange={() => setRole('CUSTOMER')}
                  />
                  <Ticket size={22} aria-hidden="true" />
                  <strong>Khách mua vé</strong>
                  <small>Tìm kiếm & săn vé sự kiện</small>
                </label>
                <label className={styles.roleOption}>
                  <input
                    type="radio"
                    name="role"
                    value="ORGANIZER"
                    checked={role === 'ORGANIZER'}
                    onChange={() => setRole('ORGANIZER')}
                  />
                  <BriefcaseBusiness size={22} aria-hidden="true" />
                  <strong>Ban tổ chức</strong>
                  <small>Đăng sự kiện & quản lý bán vé</small>
                </label>
              </div>
            </fieldset>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="fullName">
                  Họ và tên<span className={styles.required}> *</span>
                </label>
              </div>
              <div className={`${styles.control} ${fieldErrors.fullName ? styles.invalid : ''}`}>
                <span className={styles.icon}>
                  <UserRound size={16} aria-hidden="true" />
                </span>
                <input
                  id="fullName"
                  name="fullName"
                  placeholder="Nhập họ và tên"
                  autoComplete="name"
                  required
                  maxLength={255}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  disabled={pending}
                  aria-invalid={fieldErrors.fullName ? true : undefined}
                  aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                />
              </div>
              {fieldErrors.fullName && (
                <p id="fullName-error" className={styles.error}>
                  {fieldErrors.fullName}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="email">
                  Email<span className={styles.required}> *</span>
                </label>
              </div>
              <div className={styles.control}>
                <span className={styles.icon}>
                  <Mail size={16} aria-hidden="true" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Nhập email"
                  autoComplete="email"
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
                <label htmlFor="phone">Số điện thoại</label>
                <span id="phone-hint" className={styles.hint}>
                  Không bắt buộc
                </span>
              </div>
              <div className={styles.control}>
                <span className={styles.icon}>
                  <Phone size={16} aria-hidden="true" />
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={pending}
                  aria-describedby="phone-hint"
                />
              </div>
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password">
                  Mật khẩu<span className={styles.required}> *</span>
                </label>
                <span id="password-hint" className={styles.hint}>
                  Tối thiểu 8 ký tự
                </span>
              </div>
              <div className={`${styles.control} ${fieldErrors.password ? styles.invalid : ''}`}>
                <span className={styles.icon}>
                  <LockKeyhole size={16} aria-hidden="true" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tạo mật khẩu"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  aria-describedby={
                    fieldErrors.password ? 'password-hint password-error' : 'password-hint'
                  }
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
              {fieldErrors.password && (
                <p id="password-error" className={styles.error}>
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="confirmPassword">
                  Xác nhận mật khẩu<span className={styles.required}> *</span>
                </label>
              </div>
              <div
                className={`${styles.control} ${fieldErrors.confirmPassword ? styles.invalid : ''}`}
              >
                <span className={styles.icon}>
                  <LockKeyhole size={16} aria-hidden="true" />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  required
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={pending}
                  aria-invalid={fieldErrors.confirmPassword ? true : undefined}
                  aria-describedby={
                    fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
                  }
                />
                <button
                  type="button"
                  className={styles.toggle}
                  disabled={pending}
                  aria-label={`${showConfirmPassword ? 'Ẩn' : 'Hiện'} xác nhận mật khẩu`}
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirmPassword-error" className={styles.error}>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
            {error && (
              <p className={styles.notice} role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className={`${styles.button} ${styles.submit}`}
              disabled={pending}
            >
              {pending ? 'Đang đăng ký…' : 'Đăng ký'}
              {!pending && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>
          <p className={styles.switch}>
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay ›</Link>
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
