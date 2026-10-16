import type { StaffFilterState, StaffStatusFilter } from '../types/staff'
import styles from './EventFilterBar.module.css'

interface EventFilterBarProps {
  filters: StaffFilterState
  onFilterChange: (updater: (prev: StaffFilterState) => StaffFilterState) => void
  onReset: () => void
  hasActiveFilters: boolean
  totalCount?: number
  organizers?: string[]
}

function getTodayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function EventFilterBar({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
  totalCount,
  organizers = [],
}: EventFilterBarProps) {
  const todayYmd = getTodayYmd()

  function handleSearch(val: string) {
    onFilterChange(prev => ({ ...prev, search: val }))
  }

  function handleStatus(val: StaffStatusFilter) {
    onFilterChange(prev => ({ ...prev, statusFilter: val }))
  }

  function handleDateChange(val: string) {
    onFilterChange(prev => ({ ...prev, selectedDate: val }))
  }

  function handleOrganizerChange(val: string) {
    onFilterChange(prev => ({ ...prev, organizer: val }))
  }

  return (
    <div className={styles.wrapper}>
      {/* Hàng 1: Tìm kiếm Realtime (Ctrl + F) & Lọc Trạng thái */}
      <div className={styles.topRow}>
        <div className={styles.searchArea}>
          <span className={`material-symbols-outlined text-[18px] ${styles.searchIcon}`}>
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm nhanh (Ctrl + F): tên sự kiện, địa điểm, BTC..."
            value={filters.search}
            onChange={e => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
          {filters.search && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => handleSearch('')}
              title="Xóa tìm kiếm"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className={styles.statusTabs}>
          <button
            type="button"
            className={`${styles.statusTabBtn} ${filters.statusFilter === 'ALL' ? styles.statusTabBtnActive : ''}`}
            onClick={() => handleStatus('ALL')}
          >
            Tất cả {totalCount !== undefined ? `(${totalCount})` : ''}
          </button>
          <button
            type="button"
            className={`${styles.statusTabBtn} ${filters.statusFilter === 'ONGOING' ? styles.statusTabBtnActive : ''}`}
            onClick={() => handleStatus('ONGOING')}
          >
            ⚡ Đang diễn ra
          </button>
          <button
            type="button"
            className={`${styles.statusTabBtn} ${filters.statusFilter === 'APPROVED' ? styles.statusTabBtnActive : ''}`}
            onClick={() => handleStatus('APPROVED')}
          >
            Sắp tới
          </button>
          <button
            type="button"
            className={`${styles.statusTabBtn} ${filters.statusFilter === 'COMPLETED' ? styles.statusTabBtnActive : ''}`}
            onClick={() => handleStatus('COMPLETED')}
          >
            Đã kết thúc
          </button>
        </div>
      </div>

      {/* Hàng 2: Chọn ngày cụ thể & Select chọn Nhà tổ chức */}
      <div className={styles.bottomRow}>
        <div className={styles.dateFilterGroup}>
          <span className={styles.dateFilterLabel}>
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
            <span>Ngày:</span>
          </span>

          <button
            type="button"
            className={`${styles.dateChip} ${!filters.selectedDate ? styles.dateChipActive : ''}`}
            onClick={() => handleDateChange('')}
          >
            Tất cả ngày
          </button>

          <button
            type="button"
            className={`${styles.dateChip} ${filters.selectedDate === todayYmd ? styles.dateChipActive : ''}`}
            onClick={() => handleDateChange(todayYmd)}
          >
            Hôm nay
          </button>

          <input
            type="date"
            value={filters.selectedDate}
            onChange={e => handleDateChange(e.target.value)}
            className={styles.customDateInput}
            title="Chọn ngày cụ thể"
          />
        </div>

        {/* Select Dropdown chọn Nhà tổ chức */}
        {organizers.length > 0 && (
          <div className={styles.organizerFilterGroup}>
            <span className={styles.dateFilterLabel}>
              <span className="material-symbols-outlined text-[16px] text-primary">business</span>
              <span>Nhà tổ chức:</span>
            </span>

            <select
              value={filters.organizer}
              onChange={e => handleOrganizerChange(e.target.value)}
              className={`${styles.organizerSelect} ${filters.organizer ? styles.organizerSelectActive : ''}`}
              title="Lọc theo nhà tổ chức"
            >
              <option value="">Tất cả nhà tổ chức ({organizers.length})</option>
              {organizers.map(org => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasActiveFilters && (
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>
    </div>
  )
}
