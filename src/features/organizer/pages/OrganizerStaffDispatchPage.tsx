import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Home,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react'
import { getOrganizerEvents } from '../../events/api/event-api'
import { getStaffDispatchAllocations, getStaffDispatchSummary } from '../api/organizer-api'
import type { EventStaffDispatch, StaffDispatchSummary } from '../types/organizer'
import { eventDate } from '../../events/event-display'
import type { EventSummary } from '../../events/types/event'
import styles from './OrganizerStaffDispatchPage.module.css'

export function OrganizerStaffDispatchPage() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [summary, setSummary] = useState<StaffDispatchSummary | null>(null)
  const [allocations, setAllocations] = useState<Map<number, EventStaffDispatch>>(new Map())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getOrganizerEvents({ page: 0, size: 50, search }, controller.signal),
      getStaffDispatchSummary(controller.signal).catch(() => null),
      getStaffDispatchAllocations(controller.signal).catch(() => []),
    ])
      .then(([res, sumRes, allocRes]) => {
        if (!controller.signal.aborted) {
          setEvents(res.content)
          if (sumRes) setSummary(sumRes)
          if (allocRes) {
            const map = new Map<number, EventStaffDispatch>()
            allocRes.forEach((a) => map.set(a.eventId, a))
            setAllocations(map)
          }
          setError('')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('Không thể tải danh sách sự kiện điều phối.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [search])

  const filteredEvents = events.filter((ev) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'TODAY') {
      return ev.startTime && ev.startTime.startsWith(todayIso)
    }
    if (statusFilter === 'UPCOMING') {
      return ev.status === 'APPROVED' || ev.status === 'PENDING_APPROVAL'
    }
    if (statusFilter === 'COMPLETED') {
      return ev.status === 'COMPLETED' || ev.status === 'CANCELED'
    }
    return true
  })

  return (
    <div className={styles.page}>
      {/* 1. Breadcrumb & Header Section */}
      <div className={styles.headerBlock}>
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link to="/organizer" className={styles.crumbLink}>
            <Home size={15} />
            <span>Bàn làm việc</span>
          </Link>
          <ChevronRight size={14} className={styles.crumbSep} />
          <Link to="/organizer/events" className={styles.crumbLink}>
            Quản lý sự kiện
          </Link>
          <ChevronRight size={14} className={styles.crumbSep} />
          <span className={styles.crumbActive}>Phân công nhân viên soát vé</span>
        </nav>

        <div className={styles.titleActionRow}>
          <div>
            <div className={styles.titleBadgeRow}>
              <h1 className={styles.pageTitle}>Phân công &amp; Điều phối nhân viên soát vé</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Theo dõi tình hình phân bổ nhân viên soát vé cho từng sự kiện và thực hiện phân công nhân sự.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Quick KPI Summary Bar (4 Metrics) */}
      <div className={styles.kpiGrid}>
        {/* Metric 1 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Sự kiện cần trực cổng</p>
            <div className={styles.kpiValRow}>
              <span className={styles.kpiNumber}>
                {String(summary ? summary.totalEventsNeedingStaff : events.length).padStart(2, '0')}
              </span>
              <span className={styles.kpiUnit}>sự kiện</span>
            </div>
            <p className={styles.kpiSub}>
              {events.filter((e) => e.startTime?.startsWith(todayIso)).length} sự kiện diễn ra hôm nay
            </p>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconGreen}`}>
            <Ticket size={26} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Tổng nhân viên đã phân</p>
            <div className={styles.kpiValRow}>
              <span className={styles.kpiNumber}>{summary?.totalAssignedStaff ?? 0}</span>
              <span className={styles.kpiUnit}>nhân sự</span>
            </div>
            <p className={`${styles.kpiSub} ${styles.textWarning}`}>
              <AlertCircle size={14} />
              <span>{summary?.activeStaff ?? 0} nhân viên đã kích hoạt sẵn sàng</span>
            </p>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconBlue}`}>
            <Users size={26} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Nhân viên đang kích hoạt</p>
            <div className={styles.kpiValRow}>
              <span className={styles.kpiNumber}>{summary?.activeStaff ?? 0}</span>
              <span className={styles.kpiUnit}>nhân sự</span>
            </div>
            <p className={styles.kpiSub}>Sẵn sàng làm nhiệm vụ quét vé</p>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconTeal}`}>
            <CheckCircle2 size={26} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Tỷ lệ check-in trung bình</p>
            <div className={styles.kpiValRow}>
              <span className={`${styles.kpiNumber} ${styles.textGreen}`}>
                {summary ? `${summary.avgCheckinRate}%` : '0%'}
              </span>
              <span className={styles.kpiSubMini}>tổng các sự kiện</span>
            </div>
            <div className={styles.kpiTrack}>
              <div
                className={styles.kpiFill}
                style={{ width: `${Math.min(100, summary?.avgCheckinRate ?? 0)}%` }}
              />
            </div>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconMint}`}>
            <QrCode size={26} />
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search & Filter Tabs */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarFlex}>
          {/* Search Input */}
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm theo tên sự kiện, mã sự kiện hoặc địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className={styles.filterActions}>
            <div className={styles.tabPillGroup}>
              <button
                type="button"
                className={statusFilter === 'ALL' ? styles.tabBtnActive : styles.tabBtn}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả ({events.length})
              </button>
              <button
                type="button"
                className={statusFilter === 'TODAY' ? styles.tabBtnActive : styles.tabBtn}
                onClick={() => setStatusFilter('TODAY')}
              >
                Hôm nay ({events.filter((e) => e.startTime?.startsWith(todayIso)).length})
              </button>
              <button
                type="button"
                className={statusFilter === 'UPCOMING' ? styles.tabBtnActive : styles.tabBtn}
                onClick={() => setStatusFilter('UPCOMING')}
              >
                Sắp diễn ra ({events.filter((e) => e.status === 'APPROVED' || e.status === 'PENDING_APPROVAL').length})
              </button>
              <button
                type="button"
                className={statusFilter === 'COMPLETED' ? styles.tabBtnActive : styles.tabBtn}
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Đã xong ({events.filter((e) => e.status === 'COMPLETED' || e.status === 'CANCELED').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Event Cards Grid */}
      {loading ? (
        <div className={styles.emptyBox}>
          <p>Đang tải danh sách sự kiện điều phối...</p>
        </div>
      ) : error ? (
        <div className={styles.emptyBox}>
          <p role="alert" style={{ color: '#ba1a1a' }}>{error}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className={styles.emptyBox}>
          <Ticket size={44} color="#2dc275" />
          <h3>Không tìm thấy sự kiện nào</h3>
          <p>Bạn không có sự kiện nào phù hợp với bộ lọc tìm kiếm hiện tại.</p>
        </div>
      ) : (
        <div className={styles.eventGrid}>
          {filteredEvents.map((event) => {
            const alloc = allocations.get(event.id)
            const assignedCount = alloc?.assignedStaffCount ?? 0
            const activeCount = alloc?.activeStaffCount ?? 0
            const staffNames = alloc?.staffNames || ''
            const isFinished = event.status === 'COMPLETED' || event.status === 'CANCELED'
            const isNeedStaff = !isFinished && assignedCount === 0

            return (
              <div
                key={event.id}
                className={`${styles.eventCard} ${isFinished ? styles.cardFinished : ''}`}
              >
                {/* Top Colored Indicator Line */}
                <div
                  className={
                    isFinished
                      ? styles.topLineGray
                      : isNeedStaff
                      ? styles.topLineCoral
                      : styles.topLinePrimary
                  }
                />

                <div className={styles.cardContent}>
                  {/* Header Row */}
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.headerBadges}>
                      {isFinished ? (
                        <span className={styles.badgeFinished}>
                          <CheckCircle2 size={13} />
                          ĐÃ HOÀN THÀNH SOÁT VÉ
                        </span>
                      ) : isNeedStaff ? (
                        <span className={styles.badgeSecondary}>
                          <Calendar size={13} />
                          CHƯA CÓ NHÂN SỰ
                        </span>
                      ) : (
                        <span className={styles.badgeSelling}>
                          <CheckCircle2 size={13} />
                          ĐÃ PHÂN CÔNG
                        </span>
                      )}
                      <span className={styles.eventCode}>#EVT-{event.id}</span>
                    </div>

                    {/* Staff Allocation Status Badge */}
                    {isFinished ? (
                      <span className={styles.staffBadgeMuted}>Hoàn tất ca: {assignedCount} Staff</span>
                    ) : isNeedStaff ? (
                      <span className={styles.staffBadgeError}>
                        <AlertCircle size={14} />
                        0 Staff đã phân công (Cần bố trí)
                      </span>
                    ) : (
                      <span className={styles.staffBadgeSuccess}>
                        <CheckCircle2 size={14} />
                        Đã phân công: {assignedCount} Staff ({activeCount} sẵn sàng)
                      </span>
                    )}
                  </div>

                  {/* Media & Details Row */}
                  <div className={styles.cardBodyRow}>
                    <div className={styles.posterWrap}>
                      <img
                        src={
                          event.thumbnailImageUrl ||
                          'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={event.name}
                        className={styles.posterImg}
                      />
                      <span className={styles.posterCategory}>
                        {event.categoryName || 'Sự kiện'}
                      </span>
                    </div>

                    <div className={styles.eventInfo}>
                      <h2 className={styles.eventTitle}>{event.name}</h2>
                      <div className={styles.metaList}>
                        <div className={styles.metaItem}>
                          <Calendar size={16} className={styles.metaIconPrimary} />
                          <span className={styles.metaTextBold}>
                            {eventDate(event.startTime)} • {isFinished ? 'Đã kết thúc ca trực' : 'Ca trực sự kiện'}
                          </span>
                        </div>
                        <div className={styles.metaItem}>
                          <MapPin size={16} className={styles.metaIconMuted} />
                          <span>
                            {event.address}, {event.city}
                          </span>
                        </div>
                        <div className={styles.metaItem}>
                          <Ticket size={16} className={styles.metaIconMuted} />
                          <span>
                            Trạng thái: <b>{event.status === 'APPROVED' ? 'Đang mở bán' : event.status}</b>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Staffing breakdown */}
                  {isFinished ? (
                    <div className={styles.pastResultsBox}>
                      <div className={styles.gatesHeader}>
                        <span className={styles.gatesTitle}>Kết quả vận hành:</span>
                        <span className={styles.gatesTarget}>Đã hoàn tất kiểm soát vé</span>
                      </div>
                      <div className={styles.pastResultRow}>
                        <div className={styles.pastResultLeft}>
                          <ShieldCheck size={18} className={styles.metaIconPrimary} />
                          <span>Tổng số nhân sự phục vụ sự kiện: {assignedCount} Staff</span>
                        </div>
                        <span className={styles.metaTextBold} style={{ color: '#006d3d' }}>
                          Hoàn tất ✓
                        </span>
                      </div>
                      {staffNames && (
                        <div className={styles.staffAvatarsRow} style={{ marginTop: '8px' }}>
                          <span className={styles.staffNames}>Nhân sự: {staffNames}</span>
                        </div>
                      )}
                    </div>
                  ) : isNeedStaff ? (
                    <div className={styles.calloutAlert}>
                      <AlertCircle size={20} className={styles.calloutIcon} />
                      <div>
                        <h4 className={styles.calloutTitle}>Chưa chỉ định nhân sự soát vé</h4>
                        <p className={styles.calloutDesc}>
                          Sự kiện chưa có nhân viên soát vé. Nhấn "Bắt đầu phân công Staff" bên dưới để gán nhân viên vào sự kiện.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.gatesBox}>
                      <div className={styles.gatesHeader}>
                        <span className={styles.gatesTitle}>Bố trí nhân sự soát vé:</span>
                        <span className={styles.gatesTarget}>
                          {activeCount} Staff đã kích hoạt ứng dụng
                        </span>
                      </div>

                      <div className={styles.gatesGrid3}>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Tổng nhân sự</div>
                          <div className={styles.gateStaffVal}>{assignedCount} Staff</div>
                          <div className={styles.gateSub}>Đã phân công</div>
                        </div>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Sẵn sàng trực</div>
                          <div className={`${styles.gateStaffVal} ${styles.textGreen}`}>
                            {activeCount} Staff
                          </div>
                          <div className={styles.gateSub}>Đang hoạt động</div>
                        </div>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Chờ kích hoạt</div>
                          <div className={styles.gateStaffVal}>
                            {Math.max(0, assignedCount - activeCount)} Staff
                          </div>
                          <div className={styles.gateSub}>Chờ đăng nhập</div>
                        </div>
                      </div>

                      {/* Assigned Staff Names */}
                      <div className={styles.staffAvatarsRow}>
                        <div className={styles.avatarGroup}>
                          <Users size={18} className={styles.metaIconPrimary} />
                          <span className={styles.staffNames}>
                            {staffNames ? `Nhân sự: ${staffNames}` : 'Chưa có thông tin nhân viên'}
                          </span>
                        </div>
                        <span className={activeCount > 0 ? styles.textActiveStatus : styles.textSecondaryStatus}>
                          {activeCount > 0 ? `${activeCount} nhân viên sẵn sàng` : 'Chờ kích hoạt'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  {isFinished ? (
                    <>
                      <span className={styles.footerLeftText}>
                        Ca trực đã kết thúc
                      </span>
                      <Link
                        to={`/organizer/events/${event.id}?tab=staffs`}
                        className={styles.btnManageStaff}
                      >
                        <span>Xem nhân sự sự kiện</span>
                        <ArrowRight size={18} />
                      </Link>
                    </>
                  ) : isNeedStaff ? (
                    <>
                      <span className={styles.footerLeftText} style={{ color: '#ff4d4d' }}>
                        <AlertCircle size={15} />
                        <span>Khuyến nghị phân công trước sự kiện</span>
                      </span>
                      <Link
                        to={`/organizer/events/${event.id}?tab=staffs`}
                        className={styles.btnStartStaffing}
                      >
                        <span>Bắt đầu phân công Staff</span>
                        <ArrowRight size={18} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className={styles.footerLeftText}>
                        {activeCount} / {assignedCount} nhân viên đang hoạt động
                      </span>
                      <Link
                        to={`/organizer/events/${event.id}?tab=staffs`}
                        className={styles.btnManageStaff}
                      >
                        <span>Quản lý &amp; Phân công Staff</span>
                        <ArrowRight size={18} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
