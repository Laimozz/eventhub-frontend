import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { Users, Tags, BadgeCheck, Ticket, Menu, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { errorMessage } from '../api/admin-api'
import styles from './Admin.module.css'

export function AdminLayout() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function logout() {
    setBusy(true); setError('')
    try { await signOut() } catch (cause) { setError(errorMessage(cause)) } finally { setBusy(false) }
  }
  return <div className={styles.shell}>
    {open && <button className={styles.backdrop} aria-label="Đóng menu" onClick={() => setOpen(false)} />}
    <aside className={open ? styles.sidebarOpen : styles.sidebar}>
      <div className={styles.brand}><Ticket /><div>EventHub<small>ADMIN CONSOLE</small></div></div>
      <p className={styles.eyebrow}>ĐIỀU HƯỚNG CHÍNH</p>
      <nav aria-label="Menu Admin">{[
        { to: '/admin/users', title: 'Quản lý người dùng', Icon: Users },
        { to: '/admin/event-categories', title: 'Quản lý danh mục', Icon: Tags },
        { to: '/admin/events/pending', title: 'Sự kiện chờ duyệt', Icon: BadgeCheck },
      ].map(({ to, title, Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? styles.active : ''}><Icon size={19} />{title}</NavLink>)}</nav>
      <div className={styles.sidebarBottom}><strong>CỔNG QUẢN TRỊ</strong><p>Quản lý và xét duyệt EventHub</p><button disabled={busy} onClick={logout}><LogOut size={17} />{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>
    </aside>
    <div className={styles.main}><header className={styles.topbar}><button className={styles.menu} aria-label="Mở menu điều hướng" aria-expanded={open} onClick={() => setOpen(!open)}><Menu /></button><span className={styles.badge}>ADMIN</span><div><strong>{user?.fullName}</strong><small>{user?.email}</small></div></header>
      <main className={styles.content}>{error && <p role="alert">{error}</p>}<Outlet /></main>
    </div>
  </div>
}
