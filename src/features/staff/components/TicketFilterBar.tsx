import type {
  StaffCustomerDto,
  StaffTicketFilterState,
  StaffTicketTypeDto,
} from '../types/staff'
import styles from './TicketFilterBar.module.css'

interface TicketFilterBarProps {
  filters: StaffTicketFilterState
  onFilterChange: (updater: (prev: StaffTicketFilterState) => StaffTicketFilterState) => void
  onReset: () => void
  hasActiveFilters: boolean
  customers: StaffCustomerDto[]
  ticketTypes: StaffTicketTypeDto[]
  totalTicketsCount?: number
}

export function TicketFilterBar({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
  customers,
  ticketTypes,
  totalTicketsCount,
}: TicketFilterBarProps) {
  function handleSearch(val: string) {
    onFilterChange(prev => ({ ...prev, search: val }))
  }

  function handleStatus(val: 'ALL' | 'VALID' | 'USED') {
    onFilterChange(prev => ({ ...prev, status: val }))
  }

  function handleCustomerChange(val: string) {
    const num = val === '' ? '' : Number(val)
    onFilterChange(prev => ({ ...prev, customerId: num }))
  }

  function handleTicketTypeChange(val: string) {
    const num = val === '' ? '' : Number(val)
    onFilterChange(prev => ({ ...prev, ticketTypeId: num }))
  }

  return (
    <div className={styles.wrapper}>
      {/* Hàng 1: Tìm kiếm nhanh & Lọc trạng thái check-in */}
      <div className={styles.topRow}>
        <div className={styles.searchArea}>
          <span className={`material-symbols-outlined text-[18px] ${styles.searchIcon}`}>
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã vé, tên khán giả, SĐT..."
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
            className={`${styles.statusTabBtn} ${filters.status === 'ALL' ? styles.statusTabBtnActive : ''}`}
            onClick={() => handleStatus('ALL')}
          >
            Tất cả {totalTicketsCount !== undefined ? `(${totalTicketsCount})` : ''}
          </button>
          <button
            type="button"
            className={`${styles.statusTabBtn} ${filters.status === 'VALID' ? styles.statusTabBtnActive : ''}`}
            onClick={() => handleStatus('VALID')}
          >
            ⚡ Chưa check-in
          </button>
          <button
            type="button"
            className={`${styles.statusTabBtn} ${filters.status === 'USED' ? styles.statusTabBtnActive : ''}`}
            onClick={() => handleStatus('USED')}
          >
            ✓ Đã check-in
          </button>
        </div>
      </div>

      {/* Hàng 2: Select chọn Khách hàng & Select chọn Loại vé */}
      <div className={styles.bottomRow}>
        <div className={styles.filterSelectGroup}>
          {/* Select Box Khách hàng đã đặt vé */}
          <div className={styles.selectItem}>
            <span className={styles.selectLabel}>
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              <span>Khách hàng:</span>
            </span>
            <select
              value={filters.customerId}
              onChange={e => handleCustomerChange(e.target.value)}
              className={`${styles.selectControl} ${filters.customerId !== '' ? styles.selectControlActive : ''}`}
              title="Lọc theo khách hàng đã đặt vé"
            >
              <option value="">Tất cả khách hàng ({customers.length})</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.phone ? `(${c.phone})` : ''} • {c.ticketCount} vé
                </option>
              ))}
            </select>
          </div>

          {/* Select Box Loại vé của sự kiện */}
          <div className={styles.selectItem}>
            <span className={styles.selectLabel}>
              <span className="material-symbols-outlined text-[16px] text-secondary">local_activity</span>
              <span>Hạng vé:</span>
            </span>
            <select
              value={filters.ticketTypeId}
              onChange={e => handleTicketTypeChange(e.target.value)}
              className={`${styles.selectControl} ${filters.ticketTypeId !== '' ? styles.selectControlActive : ''}`}
              title="Lọc theo loại vé"
            >
              <option value="">Tất cả loại vé ({ticketTypes.length})</option>
              {ticketTypes.map(tt => (
                <option key={tt.id} value={tt.id}>
                  {tt.name} ({Number(tt.price).toLocaleString('vi-VN')} đ)
                </option>
              ))}
            </select>
          </div>
        </div>

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
