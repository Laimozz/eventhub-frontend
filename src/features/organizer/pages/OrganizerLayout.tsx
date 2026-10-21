import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import {
  Bell,
  ChartColumn,
  CirclePlus,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Ticket,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { NotificationBell } from '../../notifications/components/NotificationBell'
import { useAuth } from '../../auth/hooks/useAuth'
import { authErrorMessage } from '../../auth/api/auth-errors'
import styles from './OrganizerLayout.module.css'

export function OrganizerLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!accountMenuOpen) return
    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [accountMenuOpen])

  async function logout() {
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (headerSearch.trim()) {
      navigate(`/organizer/events?search=${encodeURIComponent(headerSearch.trim())}`)
    }
  }

  return (
    <div className={styles.shell}>
      {menuOpen && (
        <button
          className={styles.backdrop}
          aria-label="Đóng menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Aside Sidebar */}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.brandContainer}>
            <Link className={styles.brand} to="/organizer" onClick={() => setMenuOpen(false)}>
              <div className={styles.brandLogoWrap}>
                <Ticket size={24} className={styles.brandIcon} />
              </div>
              <strong className={styles.brandName}>TicketBo</strong>
            </Link>
            <span className={styles.portalTag}>ORGANIZER PORTAL</span>
          </div>

          <div className={styles.createWrapper}>
            <NavLink
              to="/organizer/events/new/details"
              className={styles.create}
              onClick={() => setMenuOpen(false)}
            >
              <CirclePlus size={19} />
              <span>Tạo sự kiện mới</span>
            </NavLink>
          </div>

          <nav aria-label="Menu Organizer" className={styles.navigation}>
            <NavLink
              to="/organizer"
              end
              className={({ isActive }) => (isActive ? styles.active : '')}
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard size={19} />
              <span>Tổng quan</span>
            </NavLink>

            <NavLink
              to="/organizer/events"
              className={({ isActive }) => (isActive ? styles.active : '')}
              onClick={() => setMenuOpen(false)}
            >
              <Ticket size={19} />
              <span>Sự kiện của tôi</span>
            </NavLink>

            <button disabled title="Chức năng sẽ được triển khai sau" className={styles.disabledLink}>
              <Receipt size={19} />
              <span>Quản lý Booking</span>
            </button>

            <NavLink
              to="/organizer/staffs"
              className={({ isActive }) => (isActive ? styles.active : '')}
              onClick={() => setMenuOpen(false)}
            >
              <Users size={19} />
              <span>Nhân viên soát vé</span>
            </NavLink>

            <button disabled title="Chức năng sẽ được triển khai sau" className={styles.disabledLink}>
              <ChartColumn size={19} />
              <span>Báo cáo thống kê</span>
            </button>

            <NavLink
              to="/organizer/wallet"
              className={({ isActive }) => (isActive ? styles.active : '')}
              onClick={() => setMenuOpen(false)}
            >
              <Wallet size={19} />
              <span>Doanh thu &amp; Rút tiền</span>
            </NavLink>

            <NavLink
              to="/organizer/profile"
              className={({ isActive }) => (isActive ? styles.active : '')}
              onClick={() => setMenuOpen(false)}
            >
              <User size={19} />
              <span>Thông tin cá nhân</span>
            </NavLink>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.portalStatus}>
            <div className={styles.statusLive}>
              <span className={styles.statusDot} />
              <span>CỔNG BAN TỔ CHỨC</span>
            </div>
            <p className={styles.statusSub}>• Vận hành ổn định</p>
          </div>

          <button onClick={logout} disabled={pending} className={styles.btnLogout}>
            <LogOut size={17} />
            <span>{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.main}>
        <header className={styles.header}>
          <button
            className={styles.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Header Global Search Form */}
          <form className={styles.headerSearchWrap} onSubmit={handleSearchSubmit}>
            <Search size={18} className={styles.headerSearchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, đơn vé, mã đặt chỗ..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className={styles.headerSearchInput}
            />
          </form>

          {/* Account & Notifications */}
          <div className={styles.account}>
            <span className={styles.role}>BAN TỔ CHỨC</span>

            <NotificationBell />

            <div className={styles.user}>
              <strong>{user?.fullName || 'Nhà tổ chức'}</strong>
              <small>{user?.email || 'organizer@eventhub.vn'}</small>
            </div>

            <div
              className={styles.accountMenu}
              ref={accountMenuRef}
              onBlur={(event) => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
                  setAccountMenuOpen(false)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && accountMenuOpen) {
                  event.preventDefault()
                  setAccountMenuOpen(false)
                  avatarRef.current?.focus()
                }
              }}
            >
              <button
                type="button"
                className={styles.avatar}
                ref={avatarRef}
                aria-label="Menu tài khoản"
                aria-expanded={accountMenuOpen}
                aria-controls="organizer-account-menu"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              >
                {(user?.fullName || user?.email || 'O').slice(0, 1).toUpperCase()}
              </button>

              {accountMenuOpen && (
                <div id="organizer-account-menu" className={styles.accountDropdown}>
                  <div className={styles.dropdownUserHeader}>
                    <p className={styles.dropdownName}>{user?.fullName || 'Nhà tổ chức'}</p>
                    <p className={styles.dropdownEmail}>{user?.email}</p>
                  </div>
                  <Link
                    to="/organizer/profile"
                    className={styles.accountProfile}
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>Thông tin cá nhân</span>
                  </Link>
                  <Link
                    to="/organizer/profile?mode=CHANGE_PASSWORD"
                    className={styles.accountProfile}
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <KeyRound size={16} />
                    <span>Đổi mật khẩu</span>
                  </Link>
                  <Link
                    to="/organizer/notifications"
                    className={styles.accountProfile}
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <Bell size={16} />
                    <span>Thông báo</span>
                  </Link>
                  <div className={styles.accountDivider} />
                  <button
                    type="button"
                    className={styles.accountLogout}
                    onClick={logout}
                    disabled={pending}
                  >
                    <LogOut size={16} />
                    <span>{pending ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {error && <p role="alert" className={styles.error}>{error}</p>}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
