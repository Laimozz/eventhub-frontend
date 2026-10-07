import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Bell, ChartColumn, CirclePlus, LayoutDashboard, LogOut, Menu, Ticket, Users, Wallet, X } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { authErrorMessage } from '../../auth/api/auth-errors'
import styles from './OrganizerLayout.module.css'

export function OrganizerLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!accountMenuOpen) return
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [accountMenuOpen])
  async function logout() {
    if (pending) return
    setPending(true); setError('')
    try { await signOut(); navigate('/login', { replace: true }) }
    catch (cause) { setError(authErrorMessage(cause)) }
    finally { setPending(false) }
  }
  return <div className={styles.shell}>
    {menuOpen && <button className={styles.backdrop} aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
    <aside className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
      <Link className={styles.brand} to="/organizer" onClick={() => setMenuOpen(false)}><Ticket size={28} /><strong>EventHub</strong><span>ORGANIZER<br />PORTAL</span></Link>
      <NavLink to="/organizer/events/new/details" className={styles.create} onClick={() => setMenuOpen(false)}><CirclePlus size={19} /> Tạo sự kiện mới</NavLink>
      <nav aria-label="Menu Organizer" className={styles.navigation}>
        <NavLink to="/organizer" end className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}><LayoutDashboard size={19} /> Tổng quan</NavLink>
        <NavLink to="/organizer/events" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}><Ticket size={19} />Sự kiện của tôi</NavLink>
        {[{ icon: Ticket, text: 'Quản lý Booking' }, { icon: Users, text: 'Nhân viên soát vé' }, { icon: ChartColumn, text: 'Báo cáo thống kê' }, { icon: Wallet, text: 'Doanh thu & Rút tiền' }].map(({ icon: Icon, text }) => <button key={text} disabled title="Chức năng sẽ được triển khai sau"><Icon size={19} />{text}</button>)}
      </nav>
      <div className={styles.sidebarBottom}><div className={styles.portalStatus}><span /> CỔNG BAN TỔ CHỨC<small>Không gian quản lý sự kiện</small></div><button onClick={logout} disabled={pending}><LogOut size={17} />{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.header}>
        <button className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        <div className={styles.account}>
          <span className={styles.role}>BAN TỔ CHỨC</span>
          <button className={styles.bell} disabled aria-label="Thông báo (chưa triển khai)"><Bell size={21} /></button>
          <div className={styles.user}><strong>{user?.fullName || 'Nhà tổ chức'}</strong><small>{user?.email}</small></div>
          <div className={styles.accountMenu} ref={accountMenuRef}
            onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setAccountMenuOpen(false) }}
            onKeyDown={event => {
              if (event.key === 'Escape' && accountMenuOpen) {
                event.preventDefault()
                setAccountMenuOpen(false)
                avatarRef.current?.focus()
              }
            }}>
            <button type="button" className={styles.avatar} ref={avatarRef} aria-label="Menu tài khoản"
              aria-expanded={accountMenuOpen} aria-controls="organizer-account-menu" onClick={() => setAccountMenuOpen(!accountMenuOpen)}>
              {(user?.fullName || user?.email || 'O').slice(0, 1).toUpperCase()}
            </button>
            {accountMenuOpen && <div id="organizer-account-menu" className={styles.accountDropdown}>
              <button type="button" className={styles.accountLogout} onClick={logout} disabled={pending}>
                <LogOut size={17} />{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
              </button>
            </div>}
          </div>
        </div>
      </header>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <main className={styles.content}><Outlet /></main>
    </div>
  </div>
}
