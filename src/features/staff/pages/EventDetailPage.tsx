import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  getStaffEventCustomers,
  getStaffEventDetail,
  getStaffEventTickets,
  getStaffEventTicketStats,
  getStaffEventTicketTypes,
} from '../api/staff-api'
import { StaffHeader } from '../components/StaffHeader'
import { TicketFilterBar } from '../components/TicketFilterBar'
import { TicketList } from '../components/TicketList'
import { TicketStatsCard } from '../components/TicketStatsCard'
import type {
  StaffCustomerDto,
  StaffEventDetailDto,
  StaffTicketDto,
  StaffTicketFilterState,
  StaffTicketStatsDto,
  StaffTicketTypeDto,
} from '../types/staff'
import styles from './EventDetailPage.module.css'

const initialFilters: StaffTicketFilterState = {
  customerId: '',
  ticketTypeId: '',
  status: 'ALL',
  search: '',
}

function formatEventTime(startStr?: string, endStr?: string): string {
  if (!startStr) return ''
  try {
    const s = new Date(startStr)
    const hours = String(s.getHours()).padStart(2, '0')
    const mins = String(s.getMinutes()).padStart(2, '0')
    const day = String(s.getDate()).padStart(2, '0')
    const month = String(s.getMonth() + 1).padStart(2, '0')
    const year = s.getFullYear()

    if (endStr) {
      const e = new Date(endStr)
      if (!isNaN(e.getTime())) {
        const endHours = String(e.getHours()).padStart(2, '0')
        const endMins = String(e.getMinutes()).padStart(2, '0')
        return `${hours}:${mins} - ${endHours}:${endMins} • ${day}/${month}/${year}`
      }
    }
    return `${hours}:${mins} • ${day}/${month}/${year}`
  } catch {
    return startStr
  }
}

export function EventDetailPage() {
  const { eventId: paramEventId } = useParams<{ eventId: string }>()
  const eventId = Number(paramEventId)

  // Data states
  const [eventDetail, setEventDetail] = useState<StaffEventDetailDto | null>(null)
  const [stats, setStats] = useState<StaffTicketStatsDto | null>(null)
  const [customers, setCustomers] = useState<StaffCustomerDto[]>([])
  const [ticketTypes, setTicketTypes] = useState<StaffTicketTypeDto[]>([])
  const [tickets, setTickets] = useState<StaffTicketDto[]>([])

  // Pagination states
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Filter & UI states
  const [filters, setFilters] = useState<StaffTicketFilterState>(initialFilters)
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 1. Tải thông tin chung của sự kiện, thống kê, dropdown khách hàng & loại vé
  const loadInitialData = useCallback(async () => {
    if (!eventId || isNaN(eventId)) return
    setLoading(true)
    try {
      const [detailData, statsData, customersData, typesData] = await Promise.all([
        getStaffEventDetail(eventId),
        getStaffEventTicketStats(eventId),
        getStaffEventCustomers(eventId),
        getStaffEventTicketTypes(eventId),
      ])
      setEventDetail(detailData)
      setStats(statsData)
      setCustomers(customersData)
      setTicketTypes(typesData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin sự kiện'
      setAlert({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }, [eventId])

  // 2. Tải danh sách vé theo phân trang (limit) và bộ lọc
  const loadTickets = useCallback(async () => {
    if (!eventId || isNaN(eventId)) return
    setTicketsLoading(true)
    try {
      const res = await getStaffEventTickets(eventId, {
        customerId: filters.customerId,
        ticketTypeId: filters.ticketTypeId,
        status: filters.status,
        page,
        size,
      })
      setTickets(res.items || [])
      setTotalPages(res.totalPages || 0)
      setTotalElements(res.totalElements || 0)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách vé'
      setAlert({ type: 'error', message: msg })
      setTickets([])
    } finally {
      setTicketsLoading(false)
    }
  }, [eventId, filters.customerId, filters.ticketTypeId, filters.status, page, size])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Lọc tìm kiếm nhanh Realtime (Ctrl + F) trên danh sách vé trang hiện tại
  const displayedTickets = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    if (!q) return tickets

    return tickets.filter(t => {
      const codeMatch = t.ticketCode.toLowerCase().includes(q)
      const nameMatch = t.customerName?.toLowerCase().includes(q) || false
      const phoneMatch = t.customerPhone?.toLowerCase().includes(q) || false
      return codeMatch || nameMatch || phoneMatch
    })
  }, [tickets, filters.search])

  function handleFilterReset() {
    setFilters(initialFilters)
    setPage(0)
  }

  const hasActiveFilters =
    filters.customerId !== '' ||
    filters.ticketTypeId !== '' ||
    filters.status !== 'ALL' ||
    Boolean(filters.search.trim())

  if (loading && !eventDetail) {
    return (
      <div className={styles.shell}>
        <StaffHeader />
        <main className={styles.mainContent}>
          <div className="py-20 text-center text-gray-500 font-medium">
            Đang tải dữ liệu ca trực sự kiện...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <StaffHeader />

      <main className={styles.mainContent}>
        {/* Thanh điều hướng quay lại tinh tế & Badge cổng trực */}
        <div className={styles.topNavigation}>
          <Link to="/staff" className={styles.backButton}>
            <div className={styles.backIconCircle}>
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </div>
            <div className={styles.backTextGroup}>
              <span className={styles.backLabel}>Quay lại danh sách</span>
              <span className={styles.backSub}>Sự kiện ca trực</span>
            </div>
          </Link>

          <div className={styles.portalBadge}>
            <span className={styles.pulseDot} />
            <span>Cổng giám sát & tra cứu vé</span>
            <span className={styles.mobileNoticeTag}>
              <span className="material-symbols-outlined text-[13px]">smartphone</span>
              <span>Soát vé trên Mobile App</span>
            </span>
          </div>
        </div>

        {/* Thông báo Alert phản hồi nếu có lỗi */}
        {alert && (
          <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                {alert.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{alert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlert(null)}
              className={styles.alertCloseBtn}
              title="Đóng"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Hero Card thông tin sự kiện */}
        {eventDetail && (
          <div className={styles.eventHeroCard}>
            <img
              src={
                eventDetail.bannerImageUrl ||
                eventDetail.thumbnailImageUrl ||
                'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=600&q=80'
              }
              alt={eventDetail.eventName}
              className={styles.heroPoster}
            />

            <div className={styles.heroInfo}>
              <div>
                <div className={styles.heroTopRow}>
                  <h1 className={styles.eventName}>{eventDetail.eventName}</h1>
                  <span
                    className={`${styles.statusPill} ${
                      eventDetail.eventStatus === 'ONGOING'
                        ? styles.statusOngoing
                        : eventDetail.eventStatus === 'APPROVED'
                          ? styles.statusApproved
                          : styles.statusCompleted
                    }`}
                  >
                    {eventDetail.eventStatus === 'ONGOING'
                      ? '⚡ ĐANG DIỄN RA'
                      : eventDetail.eventStatus === 'APPROVED'
                        ? 'SẮP TỚI'
                        : 'ĐÃ KẾT THÚC'}
                  </span>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      schedule
                    </span>
                    <span>{formatEventTime(eventDetail.startTime, eventDetail.endTime)}</span>
                  </div>

                  <div className={styles.metaItem}>
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      location_on
                    </span>
                    <span>
                      {eventDetail.venueAddress ? `${eventDetail.venueAddress}, ` : ''}
                      {eventDetail.venueCity || 'Địa điểm tổ chức'}
                    </span>
                  </div>

                  {eventDetail.organizerName && (
                    <div className={styles.metaItem}>
                      <span className="material-symbols-outlined text-[16px] text-gray-500">
                        corporate_fare
                      </span>
                      <span>BTC: {eventDetail.organizerName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.heroStaffNotice}>
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                <span>
                  Phân công: <strong>{eventDetail.staffStatus || 'ACTIVE'}</strong> • Cổng Web dùng để theo dõi tiến độ, tra cứu vé và hỗ trợ sự cố khách hàng.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 1. Màn hình thống kê vé check-in thành công, vé chưa check-in */}
        <TicketStatsCard stats={stats} loading={loading} />

        {/* 2. Components thanh lọc: select box khách hàng, select loại vé, select trạng thái */}
        <TicketFilterBar
          filters={filters}
          onFilterChange={updater => {
            setFilters(updater)
            setPage(0)
          }}
          onReset={handleFilterReset}
          hasActiveFilters={hasActiveFilters}
          customers={customers}
          ticketTypes={ticketTypes}
          totalTicketsCount={stats?.totalTickets}
        />

        {/* 3. Components danh sách vé: list vé theo bộ lọc, phân trang kiểu limit (chỉ đọc trên Web) */}
        <TicketList
          tickets={displayedTickets}
          loading={ticketsLoading}
          page={page}
          size={size}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
          onSizeChange={newSize => {
            setSize(newSize)
            setPage(0)
          }}
        />
      </main>
    </div>
  )
}
