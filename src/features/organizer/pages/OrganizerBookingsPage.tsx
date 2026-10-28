import { useEffect, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Ticket,
  TrendingUp,
  User,
  X,
  XCircle,
} from 'lucide-react'
import {
  exportOrganizerBookingsCsv,
  getOrganizerBookingDetail,
  getOrganizerBookings,
} from '../api/organizer-bookings-api'
import { getEventFilterOptions } from '../api/organizer-reports-api'
import type { EventFilterOption } from '../types/reports'
import type {
  OrganizerBookingDetail,
  OrganizerBookingPageResponse,
  OrganizerBookingSummary,
} from '../types/bookings'
import styles from './OrganizerBookingsPage.module.css'

export function OrganizerBookingsPage() {
  const [data, setData] = useState<OrganizerBookingPageResponse | null>(null)
  const [eventsFilter, setEventsFilter] = useState<EventFilterOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [keyword, setKeyword] = useState<string>('')
  const [appliedKeyword, setAppliedKeyword] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [size] = useState<number>(10)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  // Modal Detail State
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)
  const [bookingDetail, setBookingDetail] = useState<OrganizerBookingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // Load events dropdown
  useEffect(() => {
    const controller = new AbortController()
    getEventFilterOptions(controller.signal)
      .then(setEventsFilter)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  // Load bookings list
  useEffect(() => {
    const controller = new AbortController()
    async function fetchBookings() {
      try {
        setLoading(true)
        setError('')
        const query = {
          eventId: selectedEventId !== '' ? selectedEventId : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          keyword: appliedKeyword.trim() ? appliedKeyword.trim() : undefined,
          startDate: startDate ? startDate : undefined,
          endDate: endDate ? endDate : undefined,
          page,
          size,
        }
        const res = await getOrganizerBookings(query, controller.signal)
        if (!controller.signal.aborted) {
          setData(res)
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Không thể tải danh sách đơn đặt vé. Vui lòng thử lại.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchBookings()
    return () => controller.abort()
  }, [selectedEventId, statusFilter, appliedKeyword, startDate, endDate, page, size, refreshKey])

  // Fetch Booking Detail when modal opens
  useEffect(() => {
    if (!selectedBookingId) return

    const controller = new AbortController()
    async function fetchDetail() {
      try {
        setDetailLoading(true)
        setDetailError('')
        const detail = await getOrganizerBookingDetail(selectedBookingId!, controller.signal)
        if (!controller.signal.aborted) {
          setBookingDetail(detail)
        }
      } catch {
        if (!controller.signal.aborted) {
          setDetailError('Không thể tải thông tin chi tiết đơn hàng.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false)
        }
      }
    }

    fetchDetail()
    return () => controller.abort()
  }, [selectedBookingId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setAppliedKeyword(keyword)
  }

  const handleResetFilters = () => {
    setSelectedEventId('')
    setStatusFilter('ALL')
    setKeyword('')
    setAppliedKeyword('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  const handleExportCsv = async () => {
    try {
      setExporting(true)
      const query = {
        eventId: selectedEventId !== '' ? selectedEventId : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        keyword: appliedKeyword.trim() ? appliedKeyword.trim() : undefined,
        startDate: startDate ? startDate : undefined,
        endDate: endDate ? endDate : undefined,
      }
      await exportOrganizerBookingsCsv(query)
    } catch {
      alert('Không thể xuất file CSV. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedBookingId(null)
    setBookingDetail(null)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return styles.paid
      case 'PENDING':
        return styles.pending
      case 'CANCELLED':
      case 'CANCELED':
        return styles.cancelled
      case 'EXPIRED':
        return styles.expired
      case 'PAYMENT_REVIEW':
        return styles.review
      case 'REFUNDED':
        return styles.refunded
      default:
        return styles.expired
    }
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  return (
    <div className={styles.container}>
      {/* 1. Header & Actions */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.badge}>
            <span className={styles.pulseDot} />
            HỆ THỐNG QUẢN LÝ ĐƠN HÀNG THỜI GIAN THỰC
          </div>
          <h1 className={styles.title}>Quản lý Booking</h1>
          <p className={styles.subtitle}>
            Tra cứu, kiểm soát danh sách đơn đặt vé, thông tin khách hàng và trạng thái thanh toán
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={loading ? styles.spinner : ''} />
            <span>{loading ? 'Đang tải…' : 'Làm mới'}</span>
          </button>

          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportCsv}
            disabled={exporting || loading}
            title="Xuất file CSV"
          >
            <Download size={16} />
            <span>{exporting ? 'Đang xuất CSV…' : 'Xuất file CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Overview Cards */}
      {data?.overview && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Tổng số đơn</span>
              <div className={`${styles.kpiIconWrap} ${styles.blue}`}>
                <Ticket size={18} />
              </div>
            </div>
            <div className={styles.kpiValue}>
              {data.overview.totalBookings.toLocaleString('vi-VN')}
            </div>
            <span className={styles.kpiSub}>Tất cả các sự kiện</span>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Doanh thu thanh toán</span>
              <div className={`${styles.kpiIconWrap} ${styles.green}`}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className={styles.kpiValue}>{data.overview.formattedTotalRevenue}</div>
            <span className={styles.kpiSub}>Từ các đơn thành công</span>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Đã thanh toán</span>
              <div className={`${styles.kpiIconWrap} ${styles.green}`}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#00874c' }}>
              {data.overview.paidCount.toLocaleString('vi-VN')}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>đơn</span>
            </div>
            <span className={styles.kpiSub}>Vé đã phát hành</span>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Chờ thanh toán</span>
              <div className={`${styles.kpiIconWrap} ${styles.amber}`}>
                <Clock size={18} />
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#d97706' }}>
              {data.overview.pendingCount.toLocaleString('vi-VN')}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>đơn</span>
            </div>
            <span className={styles.kpiSub}>Đang giữ chỗ vé</span>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiLabel}>Đã hủy / Hết hạn</span>
              <div className={`${styles.kpiIconWrap} ${styles.red}`}>
                <XCircle size={18} />
              </div>
            </div>
            <div className={styles.kpiValue} style={{ color: '#b91c1c' }}>
              {data.overview.cancelledCount.toLocaleString('vi-VN')}{' '}
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>đơn</span>
            </div>
            <span className={styles.kpiSub}>Không phát sinh tiền</span>
          </div>
        </div>
      )}

      {/* 3. Bộ lọc Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm theo mã #ID, tên khách, email, SĐT…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </form>

          {/* Event dropdown */}
          <div className={styles.selectGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} style={{ color: '#64748b' }} />
              <select
                className={styles.select}
                value={selectedEventId}
                onChange={(e) => {
                  setPage(0)
                  setSelectedEventId(e.target.value ? Number(e.target.value) : '')
                }}
                aria-label="Chọn sự kiện lọc"
              >
                <option value="">Tất cả sự kiện của tôi</option>
                {eventsFilter.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Trạng thái đơn Tabs & Date filters */}
        <div className={styles.filterRow}>
          <div className={styles.statusTabs}>
            {[
              ['ALL', 'Tất cả'],
              ['PAID', 'Đã thanh toán'],
              ['PENDING', 'Chờ thanh toán'],
              ['CANCELLED', 'Đã hủy'],
              ['EXPIRED', 'Hết hạn'],
              ['PAYMENT_REVIEW', 'Chờ đối soát'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`${styles.statusTabBtn} ${statusFilter === val ? styles.active : ''}`}
                onClick={() => {
                  setPage(0)
                  setStatusFilter(val)
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.dateFilterRow} style={{ borderTop: 'none', paddingTop: 0 }}>
            <Calendar size={15} style={{ color: '#64748b' }} />
            <span>Từ:</span>
            <input
              type="date"
              className={styles.dateInput}
              value={startDate}
              onChange={(e) => {
                setPage(0)
                setStartDate(e.target.value)
              }}
            />
            <span>Đến:</span>
            <input
              type="date"
              className={styles.dateInput}
              value={endDate}
              onChange={(e) => {
                setPage(0)
                setEndDate(e.target.value)
              }}
            />

            {(selectedEventId || statusFilter !== 'ALL' || appliedKeyword || startDate || endDate) && (
              <button type="button" className={styles.resetBtn} onClick={handleResetFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={styles.errorState}>
          <p style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</p>
          <button type="button" className={styles.actionBtn} onClick={() => setRefreshKey((k) => k + 1)}>
            Thử lại
          </button>
        </div>
      )}

      {/* 4. Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableInfoRow}>
          <span>
            Tìm thấy <strong>{data?.totalElements ?? 0}</strong> đơn đặt vé phù hợp
          </span>
          {data && data.totalPages > 1 && (
            <span>
              Trang <strong>{page + 1}</strong> / <strong>{data.totalPages}</strong>
            </span>
          )}
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sự kiện</th>
                <th>Số vé</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className={styles.spinner} style={{ margin: '0 auto 10px' }} />
                    <span style={{ color: '#64748b' }}>Đang tải danh sách đơn đặt vé…</span>
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((item: OrganizerBookingSummary) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.bookingIdCell}>
                        <span className={styles.idTag}>#{item.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.customerCell}>
                        <span className={styles.customerName}>{item.customerName}</span>
                        <span className={styles.customerMeta}>
                          {item.customerEmail} • {item.customerPhone || 'Chưa có SĐT'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.eventCell}>
                        <span className={styles.eventName} title={item.eventName}>
                          {item.eventName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{item.totalTickets}</strong> vé
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{item.formattedTotalAmount}</strong>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                        {item.statusLabel}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        {formatDateTime(item.createdAt)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setSelectedBookingId(item.id)}
                      >
                        <Eye size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Không có đơn đặt vé nào phù hợp với bộ lọc hiện tại
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination */}
        {data && data.totalPages > 1 && (
          <div className={styles.pagination}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Hiển thị {page * size + 1} - {Math.min((page + 1) * size, data.totalElements)} trong số {data.totalElements} đơn
            </span>

            <div className={styles.pageControls}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                &larr; Trước
              </button>

              {Array.from({ length: Math.min(5, data.totalPages) }).map((_, idx) => {
                let pNum = page - 2 + idx
                if (page < 2) pNum = idx
                if (pNum >= data.totalPages) return null
                return (
                  <button
                    key={pNum}
                    type="button"
                    className={`${styles.pageBtn} ${page === pNum ? styles.active : ''}`}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum + 1}
                  </button>
                )
              })}

              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
              >
                Sau &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Modal Chi tiết Đơn đặt vé */}
      {selectedBookingId && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <span className={styles.idTag}>#{selectedBookingId}</span>
                <h2 className={styles.modalTitle}>Chi tiết Đơn đặt vé</h2>
                {bookingDetail && (
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(bookingDetail.status)}`}>
                    {bookingDetail.statusLabel}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleCloseModal}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className={styles.spinner} style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: '#64748b' }}>Đang tải dữ liệu chi tiết đơn hàng…</p>
                </div>
              ) : detailError ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#b91c1c' }}>
                  {detailError}
                </div>
              ) : bookingDetail ? (
                <>
                  {/* Grid 2 cột: Thông tin Khách hàng & Sự kiện */}
                  <div className={styles.detailGrid}>
                    {/* Cột 1: Khách hàng */}
                    <div className={styles.detailCard}>
                      <span className={styles.detailCardTitle}>
                        <User size={15} /> Thông tin khách hàng
                      </span>
                      <div className={styles.detailRow}>
                        <span>Họ và tên:</span>
                        <strong>{bookingDetail.customerName}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Email:</span>
                        <strong>{bookingDetail.customerEmail}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Số điện thoại:</span>
                        <strong>{bookingDetail.customerPhone || 'Chưa cung cấp'}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Thời gian đặt:</span>
                        <strong>{formatDateTime(bookingDetail.createdAt)}</strong>
                      </div>
                    </div>

                    {/* Cột 2: Sự kiện & Thanh toán */}
                    <div className={styles.detailCard}>
                      <span className={styles.detailCardTitle}>
                        <Ticket size={15} /> Thông tin sự kiện
                      </span>
                      <div className={styles.detailRow}>
                        <span>Sự kiện:</span>
                        <strong>{bookingDetail.eventName}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Địa điểm:</span>
                        <strong>{bookingDetail.venueName}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Bắt đầu:</span>
                        <strong>{formatDateTime(bookingDetail.eventStartTime)}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Tổng tiền đơn:</span>
                        <strong style={{ color: '#00874c', fontSize: '15px' }}>
                          {bookingDetail.formattedTotalAmount}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Bảng Danh sách loại vé đã mua */}
                  <div>
                    <h3 className={styles.detailSectionTitle}>Loại vé đã đặt</h3>
                    <div className={styles.tableWrapper} style={{ marginTop: '8px' }}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Loại vé</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookingDetail.items.map((it) => (
                            <tr key={it.id}>
                              <td>
                                <strong>{it.ticketTypeName}</strong>
                              </td>
                              <td>{it.formattedUnitPrice}</td>
                              <td>
                                <strong>{it.quantity}</strong>
                              </td>
                              <td>
                                <strong style={{ color: '#0f172a' }}>{it.formattedSubtotal}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bảng Danh sách từng vé con & Trạng thái Check-in */}
                  {bookingDetail.tickets.length > 0 && (
                    <div>
                      <h3 className={styles.detailSectionTitle}>
                        Danh sách vé phát hành ({bookingDetail.tickets.length})
                      </h3>
                      <div className={styles.tableWrapper} style={{ marginTop: '8px' }}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Mã vé</th>
                              <th>Loại vé</th>
                              <th>Trạng thái vé</th>
                              <th>Tiến độ Check-in</th>
                              <th>Nhân viên soát vé</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookingDetail.tickets.map((t) => {
                              const isUsed = t.status === 'USED' || !!t.checkedInAt
                              return (
                                <tr key={t.id}>
                                  <td>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                                      {t.ticketCode}
                                    </span>
                                  </td>
                                  <td>{t.ticketTypeName}</td>
                                  <td>
                                    <span
                                      className={`${styles.statusBadge} ${
                                        isUsed
                                          ? styles.paid
                                          : t.status === 'CANCELED'
                                          ? styles.cancelled
                                          : styles.review
                                      }`}
                                    >
                                      {isUsed ? 'ĐÃ CHECK-IN' : t.status === 'CANCELED' ? 'ĐÃ HỦY' : 'HỢP LỆ'}
                                    </span>
                                  </td>
                                  <td>
                                    {t.checkedInAt ? (
                                      <span style={{ color: '#00874c', fontWeight: 600 }}>
                                        {formatDateTime(t.checkedInAt)}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#64748b' }}>Chưa check-in</span>
                                    )}
                                  </td>
                                  <td>
                                    <span>{t.checkedInByName || '-'}</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Lịch sử giao dịch Thanh toán & Hoàn tiền */}
                  <div>
                    <h3 className={styles.detailSectionTitle}>Giao dịch &amp; Thanh toán</h3>
                    {bookingDetail.payments.length > 0 ? (
                      <div className={styles.tableWrapper} style={{ marginTop: '8px' }}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Mã giao dịch</th>
                              <th>Phương thức</th>
                              <th>Số tiền</th>
                              <th>Trạng thái</th>
                              <th>Thời gian thanh toán</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookingDetail.payments.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <span style={{ fontFamily: 'monospace' }}>{p.transactionId}</span>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 600 }}>{p.paymentMethod}</span>
                                </td>
                                <td>
                                  <strong>{p.formattedAmount}</strong>
                                </td>
                                <td>
                                  <span
                                    className={`${styles.statusBadge} ${
                                      p.status === 'SUCCESS' ? styles.paid : styles.pending
                                    }`}
                                  >
                                    {p.status === 'SUCCESS' ? 'Thành công' : p.status}
                                  </span>
                                </td>
                                <td>{formatDateTime(p.paidAt || p.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                        Chưa có giao dịch thanh toán nào được ghi nhận
                      </p>
                    )}

                    {/* Hoàn tiền nếu có */}
                    {bookingDetail.refund && (
                      <div style={{ marginTop: '14px', background: '#fdf2f8', border: '1px solid #fbcfe8', padding: '12px 16px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9d174d', fontWeight: 700, fontSize: '13px' }}>
                          <CreditCard size={16} /> Thông tin hoàn tiền
                        </div>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '6px', fontSize: '13px' }}>
                          <span>Mã hoàn: <strong>{bookingDetail.refund.refundTransactionId}</strong></span>
                          <span>Số tiền: <strong>{bookingDetail.refund.formattedAmount}</strong></span>
                          <span>Trạng thái: <strong>{bookingDetail.refund.status}</strong></span>
                          <span>Ngày hoàn: <strong>{formatDateTime(bookingDetail.refund.refundedAt)}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={handleCloseModal}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
