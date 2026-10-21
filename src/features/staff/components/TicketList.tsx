import type { StaffTicketDto } from '../types/staff'
import styles from './TicketList.module.css'

interface TicketListProps {
  tickets: StaffTicketDto[]
  loading?: boolean
  page: number
  size: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

function formatDateTime(isoString: string | null): string {
  if (!isoString) return '--'
  try {
    const d = new Date(isoString)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${hours}:${minutes} • ${day}/${month}`
  } catch {
    return isoString
  }
}

export function TicketList({
  tickets,
  loading = false,
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
}: TicketListProps) {
  const startItem = totalElements === 0 ? 0 : page * size + 1
  const endItem = Math.min((page + 1) * size, totalElements)

  return (
    <div className={styles.container}>
      {/* Header bar */}
      <div className={styles.tableHeaderBar}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <span className="material-symbols-outlined text-[18px]">list_alt</span>
          </div>
          <div>
            <h3 className={styles.title}>Danh sách vé theo bộ lọc</h3>
            <p className={styles.subtitle}>
              {loading
                ? 'Đang tải danh sách vé...'
                : `Tìm thấy ${totalElements.toLocaleString()} vé phù hợp`}
            </p>
          </div>
        </div>

        <div className={styles.paginationControls}>
          <span className="text-[12px] text-gray-500 font-medium">Hiển thị / trang:</span>
          <select
            value={size}
            onChange={e => onSizeChange(Number(e.target.value))}
            className={styles.pageSizeSelect}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table Body or Loading / Empty state */}
      {loading ? (
        <div className={styles.loadingSkeleton}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <h4 className={styles.emptyTitle}>Không tìm thấy vé nào</h4>
          <p className={styles.emptyText}>
            Không có vé nào khớp với tiêu chí tìm kiếm hoặc bộ lọc khách hàng, loại vé, trạng thái hiện tại.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.ticketTable}>
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Khán giả / Liên hệ</th>
                <th>Hạng vé</th>
                <th>Trạng thái</th>
                <th>Thời gian soát vé</th>
                <th style={{ textAlign: 'right' }}>Hình thức soát vé</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => {
                const isUsed = t.status === 'USED'
                const isCancelled = t.status === 'CANCELLED'

                return (
                  <tr key={t.ticketId}>
                    {/* Mã vé */}
                    <td>
                      <div className={styles.ticketCodeCell}>
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          confirmation_number
                        </span>
                        <span className={styles.ticketCode}>#{t.ticketCode}</span>
                      </div>
                    </td>

                    {/* Khán giả */}
                    <td>
                      <div className={styles.customerName}>{t.customerName || 'Khách vãng lai'}</div>
                      <div className={styles.customerMeta}>
                        {t.customerPhone ? `SĐT: ${t.customerPhone}` : t.customerEmail}
                      </div>
                    </td>

                    {/* Hạng vé & giá */}
                    <td>
                      <span className={styles.ticketTypeBadge}>{t.ticketTypeName}</span>
                      <div className={styles.ticketPrice}>
                        {Number(t.ticketPrice).toLocaleString('vi-VN')} đ
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td>
                      {isUsed ? (
                        <span className={styles.statusUsed}>
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          ĐÃ CHECK-IN
                        </span>
                      ) : isCancelled ? (
                        <span className={styles.statusCancelled}>
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          ĐÃ HỦY
                        </span>
                      ) : (
                        <span className={styles.statusValid}>
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          CHƯA CHECK-IN
                        </span>
                      )}
                    </td>

                    {/* Thời gian soát */}
                    <td>
                      {isUsed ? (
                        <div>
                          <div className={styles.checkInTime}>
                            <span className="material-symbols-outlined text-[14px]">done_all</span>
                            <span>{formatDateTime(t.checkedInAt)}</span>
                          </div>
                          {t.checkedInByName && (
                            <div className={styles.checkInStaff}>
                              Soát bởi: {t.checkedInByName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[12px]">--</span>
                      )}
                    </td>

                    {/* Kênh soát vé (Chỉ trên Mobile) */}
                    <td style={{ textAlign: 'right' }}>
                      {isUsed ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div className={styles.badgeUsedMobile}>
                            <span className="material-symbols-outlined text-[14px]">smartphone</span>
                            <span>Đã quét vào cổng</span>
                          </div>
                          <div className={styles.checkedInTimeMeta}>
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            <span>{formatDateTime(t.checkedInAt)}</span>
                          </div>
                        </div>
                      ) : isCancelled ? (
                        <span className={styles.statusCancelled}>
                          <span className="material-symbols-outlined text-[13px]">cancel</span>
                          Vé đã hủy
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span className={styles.badgeWaiting}>
                            <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                            <span>Chờ quét tại cổng</span>
                          </span>
                          <span className={styles.waitingSub}>Chỉ quét trên Mobile App</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 0 && (
        <div className={styles.paginationBar}>
          <div className={styles.pageInfo}>
            Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trong tổng số{' '}
            <strong>{totalElements.toLocaleString()}</strong> vé
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(0)}
              disabled={page === 0 || loading}
              title="Về trang đầu"
            >
              <span className="material-symbols-outlined text-[16px]">first_page</span>
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0 || loading}
              title="Trang trước"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            {/* Display up to 5 page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = page - 2 + i
              if (pageNum < 0) pageNum = i
              if (pageNum >= totalPages) pageNum = totalPages - 1 - (4 - i)
              if (pageNum < 0 || pageNum >= totalPages) return null

              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`${styles.pageBtn} ${pageNum === page ? styles.pageBtnActive : ''}`}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                >
                  {pageNum + 1}
                </button>
              )
            })}

            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              title="Trang tiếp"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => onPageChange(totalPages - 1)}
              disabled={page >= totalPages - 1 || loading}
              title="Đến trang cuối"
            >
              <span className="material-symbols-outlined text-[16px]">last_page</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
