import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import type { UserDetailDto } from '../types/user';
import styles from './CustomerHeader.module.css';

interface CustomerHeaderProps {
  user?: UserDetailDto | null;
  onSelectMode?: (mode: 'VIEW' | 'CHANGE_PASSWORD') => void;
}

export function CustomerHeader({ user: propUser, onSelectMode }: CustomerHeaderProps = {}) {
  const { signOut, user: authUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const user = propUser !== undefined ? propUser : (authUser as UserDetailDto | null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  async function handleLogout() {
    setLogoutModalOpen(false);
    await signOut();
    navigate('/login');
  }

  const initial = user?.fullName?.trim() ? user.fullName.trim().charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link to="/" className={styles.logoLink}>
              <span className={styles.logoBadge}>
                <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
              </span>
              <span>EventHub</span>
            </Link>

            <nav className={styles.navLinks}>
              <Link to="/customer/explore" className={styles.navLink}>Khám phá</Link>
              <Link to="/customer/danh-muc" className={styles.navLink}>Danh mục</Link>
            </nav>
          </div>

          <div className={styles.headerSearch}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, nghệ sĩ, địa điểm..."
              className={styles.searchInput}
              defaultValue={searchParams.get('search') || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim()
                  const params = new URLSearchParams(searchParams)
                  if (val) {
                    params.set('search', val)
                  } else {
                    params.delete('search')
                  }
                  navigate(`/customer/explore?${params.toString()}`)
                }
              }}
            />
          </div>

          <div className={styles.headerActions}>
            {user ? (
              <>
                <Link to="/customer/ve-cua-toi" className={styles.ticketBtn}>
                  <span className="material-symbols-outlined">confirmation_number</span>
                  <span>Vé của tôi</span>
                </Link>

                {/* User Dropdown Menu */}
                <div className={styles.userMenuWrapper}>
                  <button
                    type="button"
                    className={styles.userMenuBtn}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className={styles.userAvatarTiny}
                      />
                    ) : (
                      <div
                        className={styles.userAvatarTiny}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#006d3d',
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    <span className={styles.userNameHeader}>{user?.fullName || 'Người dùng'}</span>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: '#6d7b6f' }}>
                      {userMenuOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownUserHeader}>
                        <p className={styles.dropdownName}>{user?.fullName}</p>
                        <p className={styles.dropdownEmail}>{user?.email}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          if (onSelectMode) {
                            onSelectMode('VIEW');
                          } else {
                            navigate('/customer/profile');
                          }
                          setUserMenuOpen(false);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">account_circle</span>
                        <span>Thông tin cá nhân</span>
                      </button>
                      <button
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => {
                          if (onSelectMode) {
                            onSelectMode('CHANGE_PASSWORD');
                          } else {
                            navigate('/customer/profile');
                          }
                          setUserMenuOpen(false);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">key</span>
                        <span>Đổi mật khẩu</span>
                      </button>
                      <Link
                        to="/customer/booking-cua-toi"
                        className={styles.dropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        <span>Booking của tôi</span>
                      </Link>
                      <Link
                        to="/customer/ve-cua-toi"
                        className={styles.dropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                        <span>Vé của tôi</span>
                      </Link>
                      <Link
                        to="/customer/thong-bao"
                        className={styles.dropdownItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">notifications</span>
                        <span>Thông báo</span>
                      </Link>
                      <div style={{ height: '1px', background: '#eceef0', margin: '4px 0' }} />
                      <button
                        type="button"
                        className={`${styles.dropdownItem} ${styles.danger}`}
                        onClick={() => {
                          setUserMenuOpen(false);
                          setLogoutModalOpen(true);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.guestActions}>
                <Link to="/login" className={styles.btnLogin}>Đăng nhập</Link>
                <Link to="/register" className={styles.btnRegister}>Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Modal */}
      {logoutModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setLogoutModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ba1a1a' }}>
                <span className="material-symbols-outlined text-[24px]">logout</span>
                <h3 className={styles.modalTitle}>Xác nhận đăng xuất</h3>
              </div>
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d7b6f' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className={styles.modalBodyText}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản EventHub không?
            </p>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setLogoutModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.btnConfirmLogout}
                onClick={handleLogout}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
