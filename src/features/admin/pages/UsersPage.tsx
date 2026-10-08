import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Plus } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { adminApi, errorMessage, fieldErrors } from '../api/admin-api'
import { useAdminData } from '../hooks/use-admin-data'
import { Dialog, LoadState, Pagination } from '../components/AdminComponents'
import type { AdminUser } from '../types/admin'
import styles from './Admin.module.css'

export function UsersPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const query = params.toString()
  const { data, error, loading, reload } = useAdminData(useCallback((signal: AbortSignal) => adminApi.users(query, signal), [query]))
  const [create, setCreate] = useState(false)
  const [target, setTarget] = useState<AdminUser>()
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  function close() { if (!sending.current) { setCreate(false); setTarget(undefined) } }
  function changePage(page: number) { const next = new URLSearchParams(params); next.set('page', String(page)); setParams(next) }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    setFormError(''); setErrors({})
    const fields = new FormData(event.currentTarget)
    const password = String(fields.get('password') ?? '')
    if (create && new TextEncoder().encode(password).length > 72) { setErrors({ password: 'Mật khẩu không được vượt quá 72 byte UTF-8.' }); return }
    sending.current = true; setBusy(true)
    try {
      if (create) await adminApi.createUser({ fullName: String(fields.get('fullName')).trim(), email: String(fields.get('email')).trim(), phone: String(fields.get('phone')).trim(), password, role: String(fields.get('role')) })
      else if (target) await adminApi.status(target.id, target.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE')
      setCreate(false); setTarget(undefined); setNotice('Đã cập nhật người dùng thành công.'); reload()
    } catch (cause) { setFormError(errorMessage(cause)); setErrors(fieldErrors(cause)) }
    finally { sending.current = false; setBusy(false) }
  }
  return <>
    <div className={styles.heading}><div><h1>Quản lý người dùng</h1><p>Quản lý tài khoản và quyền truy cập EventHub.</p></div><button className={styles.primary} onClick={() => { setFormError(''); setErrors({}); setShowPassword(false); setCreate(true) }}><Plus size={18} />Thêm người dùng</button></div>
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    <section className={styles.panel}>
      <form className={styles.filters} key={query} onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); const next = new URLSearchParams(); const keyword = String(values.get('keyword')).trim(); const role = String(values.get('role')); if (keyword) next.set('keyword', keyword); if (role) next.set('role', role); setParams(next) }}>
        <label>Tìm người dùng<input name="keyword" placeholder="Nhập tên hoặc email…" defaultValue={params.get('keyword') ?? ''} maxLength={255} /></label>
        <label>Vai trò<select name="role" defaultValue={params.get('role') ?? ''}><option value="">Tất cả vai trò</option>{['ADMIN', 'CUSTOMER', 'ORGANIZER', 'STAFF'].map(role => <option key={role}>{role}</option>)}</select></label><button type="submit">Tìm kiếm</button>
      </form>
      <LoadState loading={loading} error={error} retry={reload} />
      {data && <><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Họ và tên</th><th>Email</th><th>Số điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{data.items.map(item => <tr key={item.id}>
        <td><strong>{item.fullName || 'Chưa cập nhật'}</strong><small>#{item.id}{user?.id === item.id ? ' • Bạn' : ''}</small></td><td>{item.email}</td><td>{item.phone || '—'}</td><td>{item.role}</td>
        <td><span className={item.status === 'ACTIVE' ? styles.badge : styles.badge + ' ' + styles.locked}>{item.status === 'ACTIVE' ? 'Đang hoạt động' : 'Bị khóa'}</span></td>
        <td><button disabled={user?.id === item.id} title={user?.id === item.id ? 'Không thể khóa chính mình' : undefined} onClick={() => { setFormError(''); setTarget(item) }}>{item.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</button></td>
      </tr>)}</tbody></table></div>{!data.items.length && <p className={styles.empty}>Không tìm thấy người dùng phù hợp.</p>}<Pagination {...data} change={changePage} /></>}
    </section>
    {(create || target) && <Dialog title={create ? 'Thêm người dùng' : target?.status === 'ACTIVE' ? 'Khóa người dùng' : 'Mở khóa người dùng'} busy={busy} close={close}>
      <form onSubmit={save}>{create ? <>
        <label>Họ và tên<input name="fullName" required maxLength={255} autoFocus />{errors.fullName && <span className={styles.fieldError}>{errors.fullName}</span>}</label>
        <label>Email<input name="email" type="email" required maxLength={255} />{errors.email && <span className={styles.fieldError}>{errors.email}</span>}</label>
        <label>Số điện thoại<input name="phone" required maxLength={20} />{errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}</label>
        <label>Mật khẩu<input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} />{(errors.password || errors.passwordWithinByteLimit) && <span className={styles.fieldError}>{errors.password || errors.passwordWithinByteLimit}</span>}</label>
        <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button>
        <label>Vai trò<select name="role"><option value="CUSTOMER">Khách hàng</option><option value="ORGANIZER">Nhà tổ chức</option></select></label>
      </> : <p>Xác nhận {target?.status === 'ACTIVE' ? 'khóa' : 'mở khóa'} tài khoản <strong>{target?.email}</strong>?</p>}
        {formError && <p role="alert" className={styles.error}>{formError}</p>}
        <div className={styles.actions}><button type="button" disabled={busy} onClick={close}>Hủy bỏ</button><button type="submit" className={styles.primary} disabled={busy}>{busy ? 'Đang lưu…' : create ? 'Tạo người dùng' : 'Xác nhận'}</button></div>
      </form>
    </Dialog>}
  </>
}
