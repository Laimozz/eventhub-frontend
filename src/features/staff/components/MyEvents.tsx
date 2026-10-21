import type { StaffAssignedEventDto } from '../types/staff'
import { EventCard } from './EventCard'
import { useStaffEvents } from '../hooks/useStaffEvents'
import styles from './MyEvents.module.css'

interface MyEventsProps {
  events?: StaffAssignedEventDto[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  hasActiveFilters?: boolean
  onResetFilters?: () => void
}

export function MyEvents({
  events: propEvents,
  loading: propLoading,
  error: propError,
  onRetry: propRetry,
  hasActiveFilters: propHasFilters,
  onResetFilters: propReset,
}: MyEventsProps = {}) {
  // If props are provided, use them. Otherwise fallback to the hook.
  const hookData = useStaffEvents()

  const events = propEvents !== undefined ? propEvents : hookData.filteredEvents
  const loading = propLoading !== undefined ? propLoading : hookData.loading
  const error = propError !== undefined ? propError : hookData.error
  const onRetry = propRetry || hookData.reload
  const hasActiveFilters = propHasFilters !== undefined ? propHasFilters : hookData.hasActiveFilters
  const onResetFilters = propReset || hookData.resetFilters

  return (
    <section className={styles.container}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <span className="material-symbols-outlined text-[22px]">event_available</span>
          </div>
          <div>
            <h2 className={styles.title}>Danh sách ca trực sự kiện</h2>
            <p className={styles.subtitle}>
              {loading
                ? 'Đang tải dữ liệu ca trực...'
                : `Hiển thị ${events.length} sự kiện phù hợp`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <div>
            <strong>Lỗi tải dữ liệu:</strong> {error}
          </div>
          <button type="button" onClick={onRetry} className={styles.retryBtn}>
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map(item => (
            <div key={item} className={styles.skeletonCard}>
              <div className={styles.skeletonPoster} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonLine} style={{ width: '80%' }} />
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                <div className={styles.skeletonLine} style={{ width: '100%', height: '30px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined text-[32px]">
              {hasActiveFilters ? 'search_off' : 'event_busy'}
            </span>
          </div>
          <h3 className={styles.emptyTitle}>
            {hasActiveFilters ? 'Không tìm thấy sự kiện phù hợp' : 'Chưa có sự kiện nào'}
          </h3>
          <p className={styles.emptyText}>
            {hasActiveFilters
              ? 'Không có sự kiện nào khớp với bộ lọc ngày, trạng thái hoặc từ khóa tìm kiếm của bạn.'
              : 'Hiện tại bạn chưa được phân công làm nhân viên soát vé cho sự kiện nào.'}
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={onResetFilters} className={styles.resetBtn}>
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Xem tất cả sự kiện</span>
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map(event => (
            <EventCard key={event.assignmentId} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}
