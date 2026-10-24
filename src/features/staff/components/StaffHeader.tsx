import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { getRoleHomePath } from '../../auth/role-home'
import styles from './StaffHeader.module.css'

export function StaffHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: PointerEvent) {
      if (e.target instanceof Node && !menuRef.current?.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [menuOpen])

  async function handleLogout() {
    setMenuOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const initial = user?.fullName?.trim() ? user.fullName.trim().charAt(0).toUpperCase() : 'S'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link to={getRoleHomePath(user?.role)} className={styles.brand} aria-label="EventHub — Trang chủ">
            <span className={styles.brandBadge}>
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </span>
            <span>EventHub</span>
            <span className={styles.roleTag}>Staff</span>
          </Link>

          <div className={styles.shiftStatus}>
            <span className={styles.pulseDot}>
              <span className={styles.pulseRing}></span>
              <span className={styles.pulseCore}></span>
            </span>
            <span>Ca trực soát vé • Online</span>
          </div>
        </div>

        <nav className={styles.navLinks} aria-label="Staff Navigation">
          <Link
            to="/customer"
            className={styles.navLink}
            title="Đến giao diện Khách hàng (khám phá sự kiện)"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Giao diện Khách hàng</span>
          </Link>

          <NavLink
            to="/staff"
            end
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className="material-symbols-outlined text-[18px]">event</span>
            <span>Sự kiện phân công</span>
          </NavLink>

          <NavLink
            to="/staff/profile"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className="material-symbols-outlined text-[18px]">account_circle</span>
            <span>Thông tin cá nhân</span>
          </NavLink>
        </nav>

        <div className={styles.right}>
          <div className={styles.accountMenu} ref={menuRef}>
            <button
              type="button"
              className={styles.accountButton}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="Menu tài khoản nhân viên"
            >
              <div className={styles.avatar}>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || 'Avatar'}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : null}
                <span className={user?.avatarUrl ? styles.avatarFallback : ''}>{initial}</span>
              </div>
              <div className={styles.accountInfo}>
                <div className={styles.accountName}>{user?.fullName || user?.email}</div>
                <div className={styles.accountRole}>Nhân viên soát vé</div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-gray-500">
                {menuOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownUserRow}>
                    <div className={styles.dropdownAvatarWrapper}>
                      <div className={styles.dropdownAvatar}>
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName || 'Avatar'}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : null}
                        <span className={user?.avatarUrl ? styles.avatarFallback : ''}>{initial}</span>
                      </div>
                      <span className={styles.dropdownOnlineBadge} title="Đang trực tuyến" />
                    </div>
                    <div className={styles.dropdownUserInfo}>
                      <div className={styles.dropdownName}>{user?.fullName || 'Nhân viên'}</div>
                      <div className={styles.dropdownEmail}>{user?.email}</div>
                      <div className={styles.dropdownRoleBadge}>
                        <span className="material-symbols-outlined text-[13px]">verified_user</span>
                        <span>Nhân viên soát vé</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to="/staff/profile"
                  className={styles.dropdownItem}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                  <span>Xem hồ sơ cá nhân</span>
                </Link>

                <Link
                  to="/staff/profile?mode=EDIT"
                  className={styles.dropdownItem}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                  <span>Chỉnh sửa thông tin</span>
                </Link>

                <Link
                  to="/staff/profile?mode=CHANGE_PASSWORD"
                  className={styles.dropdownItem}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">key</span>
                  <span>Đổi mật khẩu</span>
                </Link>

                <Link
                  to="/customer"
                  className={styles.dropdownItem}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">storefront</span>
                  <span>Về giao diện Khách hàng</span>
                </Link>

                <div className={styles.divider} />

                <button
                  type="button"
                  className={styles.logoutItem}
                  onClick={handleLogout}
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
