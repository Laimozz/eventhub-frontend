import { Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { StaffHeader } from '../components/StaffHeader'
import { EventFilterBar } from '../components/EventFilterBar'
import { MyEvents } from '../components/MyEvents'
import { useStaffEvents } from '../hooks/useStaffEvents'
import styles from './StaffDashboardPage.module.css'

export function StaffDashboardPage() {
  const { user } = useAuth()
  const initial = user?.fullName?.trim() ? user.fullName.trim().charAt(0).toUpperCase() : 'S'

  const {
    filteredEvents,
    organizers,
    loading,
    error,
    reload,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    totalCount,
  } = useStaffEvents()

  return (
    <div className={styles.shell}>
      <StaffHeader />

      <main className={styles.mainContent}>
        {/* Hero Banner with Quick Profile Management Trigger */}
        <div className={styles.heroBanner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar}>{initial}</div>
            <div className={styles.heroGreetings}>
              <div className={styles.roleChip}>
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>Nhân viên soát vé (Staff)</span>
              </div>
              <h1 className={styles.heroTitle}>Giao diện của Staff</h1>
              <p className={styles.heroSub}>
                Xin chào, <strong>{user?.fullName || user?.email || 'Nhân viên'}</strong> • Mã tài khoản: #{user?.id}
              </p>
            </div>
          </div>

          <div className={styles.heroActions}>
            <Link to="/staff/profile" className={styles.btnProfile}>
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
              <span>Quản lý thông tin cá nhân</span>
            </Link>
            <Link to="/staff/profile?mode=CHANGE_PASSWORD" className={styles.btnPassword}>
              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              <span>Đổi mật khẩu</span>
            </Link>
          </div>
        </div>

        {/* Notice for Mobile App vs Web */}
        <div className={styles.noticeBar}>
          <div className={styles.noticeLeft}>
            <span className={`material-symbols-outlined ${styles.noticeIcon}`}>devices</span>
            <div className={styles.noticeText}>
              <strong>Cổng làm việc Web:</strong> Dùng để theo dõi danh sách sự kiện, tiến độ phân công và hồ sơ tài khoản.
              Tính năng quét mã QR thực địa bằng Camera sẽ được tối ưu trên ứng dụng <strong>Mobile Staff</strong>.
            </div>
          </div>
          <div className={styles.mobilePill}>
            <span className="material-symbols-outlined text-[14px]">smartphone</span>
            <span>Mobile App sắp ra mắt</span>
          </div>
        </div>

        {/* EventFilterBar: Realtime search, Date filter, Status tabs, Organizer select */}
        <EventFilterBar
          filters={filters}
          onFilterChange={setFilters}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          totalCount={totalCount}
          organizers={organizers}
        />

        {/* MyEvents: Pure presentational list */}
        <MyEvents
          events={filteredEvents}
          loading={loading}
          error={error}
          onRetry={reload}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />
      </main>
    </div>
  )
}
