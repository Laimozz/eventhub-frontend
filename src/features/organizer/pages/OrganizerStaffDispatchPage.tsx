import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  Download,
  HelpCircle,
  Home,
  MapPin,
  Monitor,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Ticket,
  Users,
  WifiOff,
  Zap,
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
              <span className={styles.liveSyncBadge}>
                <span className={styles.pulseDot} />
                Live Scanner Sync
              </span>
            </div>
            <p className={styles.pageSubtitle}>
              Chọn sự kiện để phân bổ nhân sự trực cổng, cấp tài khoản quyền quét cho máy POS/App TicketBox Staff và giám sát tiến độ check-in theo thời gian thực.
            </p>
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.btnTopAction}
              onClick={() => alert('Đang xuất danh sách ca trực nhân sự...')}
            >
              <Download size={18} />
              <span>Xuất danh sách ca trực</span>
            </button>
            <button
              type="button"
              className={styles.btnTopSecondary}
              onClick={() => alert('Mở bảng cấu hình cổng và thiết bị POS.')}
            >
              <Monitor size={18} />
              <span>Cài đặt máy POS</span>
            </button>
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
              <span className={styles.kpiMutedUnit}>
                {summary ? `/ ${summary.totalAssignedStaff + 4} nhân sự` : 'nhân sự'}
              </span>
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
            <p className={styles.kpiLabel}>Cửa soát vé đang mở</p>
            <div className={styles.kpiValRow}>
              <span className={styles.kpiNumber}>
                {summary ? Math.max(1, Math.min(12, Number(summary.totalAssignedStaff))) : 0}
              </span>
              <span className={styles.kpiUnit}>làn kiểm soát</span>
            </div>
            <p className={styles.kpiSub}>Khu VIP, GA, CSKH &amp; Khán đài</p>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconTeal}`}>
            <DoorOpen size={26} />
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

          {/* Filters & Actions */}
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
                Hôm nay (1)
              </button>
              <button
                type="button"
                className={statusFilter === 'UPCOMING' ? styles.tabBtnActive : styles.tabBtn}
                onClick={() => setStatusFilter('UPCOMING')}
              >
                Sắp diễn ra ({events.filter((e) => e.status === 'APPROVED').length || 2})
              </button>
              <button
                type="button"
                className={statusFilter === 'COMPLETED' ? styles.tabBtnActive : styles.tabBtn}
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Đã xong (1)
              </button>
            </div>

            <button
              type="button"
              className={styles.btnStatusSelect}
              onClick={() => alert('Lọc trạng thái phân công nhân sự')}
            >
              <Users size={16} />
              <span>Tình trạng: <b>Tất cả trạng thái</b></span>
            </button>

            <a
              href="#guide-banner"
              className={styles.linkDoc}
            >
              <BookOpen size={16} />
              <span className={styles.docText}>Tài liệu Staff App</span>
            </a>
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
            const isFullyStaffed = !isFinished && assignedCount >= 4

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
                      : isFullyStaffed
                      ? styles.topLinePrimary
                      : styles.topLineGradient
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
                      ) : isFullyStaffed ? (
                        <span className={styles.badgeSelling}>
                          <Calendar size={13} />
                          ĐÃ ĐỦ NHÂN SỰ
                        </span>
                      ) : (
                        <span className={styles.badgeLive}>
                          <span className={styles.coralPulse} />
                          ĐANG ĐIỀU PHỐI
                        </span>
                      )}
                      <span className={styles.eventCode}>#EVT-{event.id}</span>
                    </div>

                    {/* Staff Allocation Warning/Status Badge */}
                    {isFinished ? (
                      <span className={styles.staffBadgeMuted}>Hoàn tất ca: {assignedCount} Staff</span>
                    ) : isNeedStaff ? (
                      <span className={styles.staffBadgeError}>
                        <AlertCircle size={14} />
                        0 Staff đã phân công (Cần bố trí)
                      </span>
                    ) : isFullyStaffed ? (
                      <span className={styles.staffBadgeSuccess}>
                        <CheckCircle2 size={14} />
                        Đã đủ nhân sự: {assignedCount} Staff ({activeCount} sẵn sàng)
                      </span>
                    ) : (
                      <span className={styles.staffBadgeWarning}>
                        <Users size={14} />
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

                  {/* Gates & Staffing Distribution breakdown */}
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
                    </div>
                  ) : isNeedStaff ? (
                    <div className={styles.calloutAlert}>
                      <AlertCircle size={20} className={styles.calloutIcon} />
                      <div>
                        <h4 className={styles.calloutTitle}>Chưa chỉ định nhân sự điều phối và quét mã</h4>
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
                          <div className={styles.gateSub}>Đã active app</div>
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
                        Ca trực đã đóng hồ sơ kiểm toán
                      </span>
                      <button
                        type="button"
                        className={styles.btnReportView}
                        onClick={() => alert(`Xem báo cáo soát vé sự kiện: ${event.name}`)}
                      >
                        <BookOpen size={18} />
                        <span>Xem báo cáo soát vé</span>
                      </button>
                    </>
                  ) : isNeedStaff ? (
                    <>
                      <span className={styles.footerLeftText} style={{ color: '#ff4d4d' }}>
                        <AlertCircle size={15} />
                        <span>Khuyến nghị phân công trước 48h</span>
                      </span>
                      <Link
                        to={`/organizer/events/${event.id}?tab=staffs`}
                        className={styles.btnStartStaffing}
                      >
                        <span>Bắt đầu phân công Staff</span>
                        <ArrowRight size={18} />
                      </Link>
                    </>
                  ) : isFullyStaffed ? (
                    <>
                      <button
                        type="button"
                        className={styles.btnGateDiagram}
                        onClick={() => alert(`Xem quy định soát vé cho sự kiện: ${event.name}`)}
                      >
                        <ShieldCheck size={18} />
                        <span>Quy định soát vé</span>
                      </button>
                      <Link
                        to={`/organizer/events/${event.id}?tab=staffs`}
                        className={styles.btnManageStaff}
                      >
                        <span>Quản lý &amp; Phân công Staff</span>
                        <ArrowRight size={18} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.btnGateDiagram}
                        onClick={() => alert(`Sơ đồ 4 cổng vào cho sự kiện: ${event.name}`)}
                      >
                        <DoorOpen size={18} />
                        <span>Sơ đồ cổng</span>
                      </button>
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

      {/* 5. Onboarding & Staff App Workflow Guide Banner */}
      <div id="guide-banner" className={styles.guideBanner}>
        <div className={styles.guideLeft}>
          <div className={styles.guideIconBox}>
            <Smartphone size={32} />
          </div>
          <div className={styles.guideContent}>
            <div className={styles.guideTitleRow}>
              <h3 className={styles.guideTitle}>
                Quy trình 3 bước chuẩn bị nhân viên soát vé tại cổng
              </h3>
              <span className={styles.guideBadge}>Cẩm nang BTC</span>
            </div>
            <p className={styles.guideDesc}>
              1. Chọn sự kiện cần trực → 2. Nhập email/SĐT nhân sự và gán cổng (VIP/GA) → 3. Cấp mã PIN quét nhanh qua ứng dụng <b>TicketBox Staff Check-in Pro</b> trên iOS &amp; Android.
            </p>
            <div className={styles.guidePillRow}>
              <span className={styles.guidePill}>
                <WifiOff size={15} />
                <span>Hỗ trợ quét Offline khi mất mạng</span>
              </span>
              <span className={styles.guidePill}>
                <Zap size={15} />
                <span>Đồng bộ dữ liệu tức thì</span>
              </span>
              <span className={styles.guidePill}>
                <ShieldCheck size={15} />
                <span>Mã hóa chống làm giả vé</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.guideActions}>
          <button
            type="button"
            className={styles.btnDownloadApp}
            onClick={() => alert('Đang chuyển hướng tải ứng dụng TicketBox Staff App...')}
          >
            <Smartphone size={18} />
            <span>Tải TicketBox Staff App</span>
          </button>
          <button
            type="button"
            className={styles.btnHelpDoc}
            onClick={() => alert('Mở tài liệu hướng dẫn vận hành thiết bị POS.')}
          >
            <HelpCircle size={18} />
            <span>Xem HDSD máy POS</span>
          </button>
        </div>
      </div>
    </div>
  )
}
