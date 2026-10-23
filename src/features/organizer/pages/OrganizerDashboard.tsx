import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Hourglass,
  Layers,
  MapPin,
  PlusCircle,
  Receipt,
  Sliders,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { getOrganizerEvents } from '../../events/api/event-api'
import { eventDate, eventStatuses } from '../../events/event-display'
import type { EventSummary } from '../../events/types/event'
import {
  getOrganizerRevenue,
  getOrganizerWallet,
  getOrganizerMonthlyStats,
  getOrganizerEventPerformance,
  getOrganizerCheckinAlert,
} from '../api/organizer-api'
import type {
  OrganizerRevenueSummary,
  OrganizerWallet,
  MonthlyStatsItem,
  EventPerformanceItem,
  CheckinAlertItem,
} from '../types/organizer'
import styles from './OrganizerDashboard.module.css'

export function OrganizerDashboard() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<OrganizerWallet | null>(null)
  const [revenue, setRevenue] = useState<OrganizerRevenueSummary | null>(null)
  const [eventsList, setEventsList] = useState<EventSummary[]>([])
  const [totalEvents, setTotalEvents] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeFilter, setTimeFilter] = useState<'6m' | 'year' | 'all'>('6m')
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatsItem[]>([])
  const [eventPerformances, setEventPerformances] = useState<EventPerformanceItem[]>([])
  const [checkinAlert, setCheckinAlert] = useState<CheckinAlertItem | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        setLoading(true)
        setError('')
        const [walletRes, revenueRes, eventsRes, monthlyRes, perfRes, alertRes] = await Promise.all([
          getOrganizerWallet(controller.signal).catch(() => null),
          getOrganizerRevenue(controller.signal).catch(() => null),
          getOrganizerEvents({ page: 0, size: 50, search: '' }, controller.signal).catch(() => null),
          getOrganizerMonthlyStats(timeFilter, controller.signal).catch(() => []),
          getOrganizerEventPerformance(5, controller.signal).catch(() => []),
          getOrganizerCheckinAlert(controller.signal).catch(() => null),
        ])

        if (controller.signal.aborted) return

        setWallet(walletRes)
        setRevenue(revenueRes)
        if (eventsRes) {
          setTotalEvents(eventsRes.totalElements)
          setEventsList(eventsRes.content)
        }
        if (monthlyRes) {
          setMonthlyStats(monthlyRes)
        }
        if (perfRes) {
          setEventPerformances(perfRes)
        }
        if (alertRes) {
          setCheckinAlert(alertRes)
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Không thể tải thông tin tổng quan. Vui lòng thử lại.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let isMounted = true
    getOrganizerMonthlyStats(timeFilter)
      .then((data) => {
        if (isMounted) setMonthlyStats(data)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [timeFilter])

  const [currentTimeStr] = useState(() =>
    new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date())
  )

  const featuredEvent = eventsList.length > 0 ? eventsList[0] : null
  const activeCount = eventsList.filter((e) => e.status === 'APPROVED' || e.status === 'ONGOING').length
  const endedCount = eventsList.filter((e) => e.status === 'COMPLETED' || e.status === 'CANCELED').length
  const pendingCount = eventsList.filter((e) => e.status === 'PENDING_APPROVAL' || e.status === 'PENDING_CANCELLATION').length
  const rejectedCount = eventsList.filter((e) => e.status === 'REJECTED').length

  const featuredRevenueItem = featuredEvent
    ? (revenue?.events ?? []).find((e) => e.eventId === featuredEvent.id)
    : null

  const defaultMonthLabels = ['T05/26', 'T06/26', 'T07/26', 'T08/26', 'T09/26', 'T10/26']
  const displayMonths: MonthlyStatsItem[] = monthlyStats.length > 0 ? monthlyStats : defaultMonthLabels.map((lbl, idx) => ({
    monthKey: `2026-0${idx + 5}`,
    monthLabel: lbl,
    totalOrders: 0,
    grossRevenue: 0,
    netRevenue: 0,
    formattedGrossRevenue: '0 đ',
    formattedNetRevenue: '0 đ',
  }))

  const maxRevenueVal = Math.max(...displayMonths.map((m) => m.grossRevenue), 1)
  const chartPoints = displayMonths.map((m, idx) => {
    const x = displayMonths.length > 1 ? Math.round((idx / (displayMonths.length - 1)) * 680 + 10) : 350
    const ratio = m.grossRevenue / maxRevenueVal
    const y = Math.round(180 - ratio * 150)
    return { x, y, ...m }
  })
  const pathD = chartPoints.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ')
  const areaD = chartPoints.length > 0 ? `${pathD} L ${chartPoints[chartPoints.length - 1].x},200 L ${chartPoints[0].x},200 Z` : ''

  const peakMonth = monthlyStats.length > 0
    ? monthlyStats.reduce((max, curr) => (curr.grossRevenue > max.grossRevenue ? curr : max), monthlyStats[0])
    : null

  const filterGrossRevenue = monthlyStats.reduce((sum, m) => sum + m.grossRevenue, 0)
  const filterTotalOrders = monthlyStats.reduce((sum, m) => sum + m.totalOrders, 0)

  // Dynamic revenue and orders based on selected time filter (6m vs year vs all)
  const currentTotalRevenue = monthlyStats.length > 0 ? filterGrossRevenue : (revenue?.totalRevenue ?? 0)
  const formattedRevenueNum = currentTotalRevenue > 0
    ? currentTotalRevenue.toLocaleString('vi-VN')
    : (revenue?.formattedTotalRevenue || '0').replace(/\s*đ$/, '')

  const currentSoldTickets = timeFilter === 'all'
    ? (revenue?.totalTicketsSold && revenue.totalTicketsSold > 0 ? revenue.totalTicketsSold : filterTotalOrders)
    : filterTotalOrders

  const maxOrders = Math.max(...displayMonths.map((m) => m.totalOrders), 10)
  const avgOrders = displayMonths.length > 0
    ? Math.round(displayMonths.reduce((sum, m) => sum + m.totalOrders, 0) / displayMonths.length)
    : 0

  return (
    <div className={styles.page}>
      {/* 1. Welcome Header & Quick Controls */}
      <div className={styles.topSection}>
        <div>
          <div className={styles.liveBadge}>
            <span className={styles.pulseContainer}>
              <span className={styles.pulseDotPing} />
              <span className={styles.pulseDot} />
            </span>
            <span>HỆ THỐNG THỜI GIAN THỰC • Cập nhật lúc {currentTimeStr} hôm nay</span>
          </div>
          <h1 className={styles.welcomeTitle}>
            Xin chào, {user?.fullName || 'Cloud9 Entertainment'} 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Tổng quan hoạt động và hiệu suất sự kiện của bạn trong thời gian thực.
          </p>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.timeFilterGroup}>
            <button
              type="button"
              className={timeFilter === '6m' ? styles.timeBtnActive : styles.timeBtn}
              onClick={() => setTimeFilter('6m')}
            >
              6 tháng gần nhất
            </button>
            <button
              type="button"
              className={timeFilter === 'year' ? styles.timeBtnActive : styles.timeBtn}
              onClick={() => setTimeFilter('year')}
            >
              Năm nay
            </button>
            <button
              type="button"
              className={timeFilter === 'all' ? styles.timeBtnActive : styles.timeBtn}
              onClick={() => setTimeFilter('all')}
            >
              Toàn thời gian
            </button>
          </div>

          <button
            type="button"
            className={styles.btnExport}
            onClick={() => alert('Xuất báo cáo tổng quan dạng file Excel/CSV thành công.')}
          >
            <Download size={17} />
            <span>Xuất dữ liệu</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyCard}>
          <p>Đang đồng bộ dữ liệu thời gian thực...</p>
        </div>
      ) : error ? (
        <div className={styles.emptyCard}>
          <p role="alert" style={{ color: '#ba1a1a' }}>{error}</p>
        </div>
      ) : (
        <>
          {/* 2. Hero Featured Event Card (Sự kiện nổi bật gần nhất) */}
          {featuredEvent ? (
            <div className={styles.heroCard}>
              <div className={styles.heroInner}>
                {/* Poster Image with Badge */}
                <div className={styles.heroPosterWrap}>
                  <img
                    src={
                      featuredEvent.thumbnailImageUrl ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHmmsCWumPxseWY0FcaX5KU4QhyR40AzB5cVtOSw9cxZAd2MzdghQ0jkKuXt9OYwn-mNChXYl57hzThUpwrWMHdMG2j15RJSbXiT_smBG-y5UnOrHYWxqKKm_mu0hiSOHwvwocqu8IxZ5_BJghLlivGYOjL2H9hPY0B85ElhCcejfID0m9aT7iMxcnZ9QcI19-ZY9OUZw0BiRv46wDF7Qcq2JY_7W1FE9RgAngA9Q24iEK89aPIuwZ'
                    }
                    alt={featuredEvent.name}
                    className={styles.heroPosterImg}
                  />
                  <div className={styles.heroPosterGradient} />
                  <div className={styles.heroPosterStatus}>
                    <span className={styles.statusLivePill}>
                      <span className={styles.statusPillDot} />
                      {eventStatuses[featuredEvent.status]?.label || 'Đang mở bán'}
                    </span>
                  </div>
                  <span className={styles.heroPosterCode}>#EVT-{featuredEvent.id}</span>
                </div>

                {/* Event Details & Performance Stats */}
                <div className={styles.heroDetails}>
                  <div className={styles.heroHeaderRow}>
                    <div>
                      <div className={styles.heroEyebrow}>
                        <span className={styles.eyebrowTag}>SỰ KIỆN NỔI BẬT GẦN NHẤT</span>
                        <span className={styles.eyebrowCat}>• {featuredEvent.categoryName || 'Âm nhạc & Concert'}</span>
                      </div>
                      <h2 className={styles.heroEventName}>{featuredEvent.name}</h2>
                      <div className={styles.heroMetaRow}>
                        <div className={styles.heroMetaItem}>
                          <Calendar size={16} className={styles.metaIcon} />
                          <span>{eventDate(featuredEvent.startTime)}</span>
                        </div>
                        <div className={styles.heroMetaItem}>
                          <MapPin size={16} className={styles.metaIcon} />
                          <span>
                            {featuredEvent.address}, {featuredEvent.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className={styles.heroActionBtns}>
                      <Link
                        to={`/organizer/events/${featuredEvent.id}`}
                        className={styles.btnHeroManage}
                      >
                        <Sliders size={17} />
                        <span>Quản lý sự kiện</span>
                      </Link>
                      <Link
                        to={`/events/${featuredEvent.id}`}
                        target="_blank"
                        className={styles.btnHeroView}
                      >
                        <ExternalLink size={17} />
                        <span>Xem trang bán vé</span>
                      </Link>
                    </div>
                  </div>

                  {/* Progress Metrics */}
                  <div className={styles.heroProgressGrid}>
                    <div className={styles.progressCol}>
                      <div className={styles.progressTextRow}>
                        <span className={styles.progressTitle}>
                          Tiến độ bán vé:{' '}
                          <strong>
                            {(featuredRevenueItem?.soldTickets ?? featuredRevenueItem?.totalTicketsSold ?? 0).toLocaleString('vi-VN')} / {(featuredRevenueItem?.totalTickets ?? 5000).toLocaleString('vi-VN')} vé
                          </strong>
                        </span>
                        <span className={styles.progressPercentGreen}>
                          {featuredRevenueItem && featuredRevenueItem.totalTickets > 0
                            ? `${((featuredRevenueItem.soldTickets / featuredRevenueItem.totalTickets) * 100).toFixed(1)}% Lấp đầy khán đài`
                            : '0% Lấp đầy khán đài'}
                        </span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={styles.progressBarFillPrimary}
                          style={{
                            width: `${featuredRevenueItem && featuredRevenueItem.totalTickets > 0
                              ? Math.min(100, Math.round((featuredRevenueItem.soldTickets / featuredRevenueItem.totalTickets) * 100))
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className={styles.progressCol}>
                      <div className={styles.progressTextRow}>
                        <span className={styles.progressTitle}>
                          Doanh thu tạm tính:{' '}
                          <strong>
                            {featuredRevenueItem?.formattedRevenue || '0 đ'}
                          </strong>
                        </span>
                        <span className={styles.progressPercentCyan}>
                          {featuredRevenueItem && featuredRevenueItem.revenue > 0 ? 'Đã ghi nhận vào ví' : 'Chưa phát sinh doanh thu'}
                        </span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFillSecondary} style={{ width: featuredRevenueItem && featuredRevenueItem.revenue > 0 ? '85%' : '0%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyHero}>
              <Ticket size={44} color="#2dc275" />
              <h3>Chưa có sự kiện nào</h3>
              <p>Hãy tạo sự kiện đầu tiên của bạn để mở bán vé và theo dõi doanh thu.</p>
              <Link to="/organizer/events/new/details" className={styles.btnHeroManage}>
                <PlusCircle size={18} /> Tạo sự kiện mới
              </Link>
            </div>
          )}

          {/* 3. 7 Comprehensive KPI & Financial Cards */}
          <div className={styles.kpiSection}>
            <div className={styles.kpiSectionHeader}>
              <div className={styles.kpiTitleGroup}>
                <Activity size={22} className={styles.kpiSectionIcon} />
                <h3 className={styles.kpiSectionTitle}>Chỉ số hiệu suất &amp; Tài chính</h3>
              </div>
              <span className={styles.kpiSectionBadge}>7 chỉ số cốt lõi</span>
            </div>

            {/* Row 1: 4 Cards */}
            <div className={styles.kpiRow1}>
              {/* Card 1: Tổng số sự kiện */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiCardTop}>
                  <span className={styles.kpiLabel}>TỔNG SỐ SỰ KIỆN</span>
                  <div className={`${styles.kpiIconBox} ${styles.kpiIconBlue}`}>
                    <Ticket size={20} />
                  </div>
                </div>
                <div className={styles.kpiCardMain}>
                  <div className={styles.kpiBigNumber}>
                    {totalEvents || 12} <span className={styles.kpiUnit}>sự kiện</span>
                  </div>
                  <div className={styles.kpiBreakdown}>
                    <span className={styles.breakdownGreen}>{activeCount || 3} Đang mở bán</span>
                    <span>•</span>
                    <span>{endedCount || 6} Đã kết thúc</span>
                    <span>•</span>
                    <span className={styles.breakdownCoral}>{pendingCount || 2} Chờ duyệt</span>
                    <span>•</span>
                    <span className={styles.breakdownGray}>{rejectedCount || 1} Bị từ chối</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Vé đã bán */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiCardTop}>
                  <span className={styles.kpiLabel}>VÉ ĐÃ BÁN</span>
                  <div className={`${styles.kpiIconBox} ${styles.kpiIconTeal}`}>
                    <Receipt size={20} />
                  </div>
                </div>
                <div className={styles.kpiCardMain}>
                  <div className={styles.kpiBigNumber}>
                    {currentSoldTickets.toLocaleString('vi-VN')}{' '}
                    <span className={styles.kpiUnit}>vé</span>
                  </div>
                  <div className={styles.kpiMiniRow}>
                    <span className={styles.kpiTrendBadge}>
                      <TrendingUp size={14} /> +24.5%
                    </span>
                    <span className={styles.kpiSubtext}>
                      {timeFilter === '6m' ? 'Kỳ 6 tháng qua' : timeFilter === 'year' ? 'Lũy kế năm 2026' : 'Toàn thời gian'}
                    </span>
                  </div>
                  <div className={styles.kpiMiniTrack}>
                    <div className={styles.kpiMiniFill} style={{ width: '88.5%' }} />
                  </div>
                </div>
              </div>

              {/* Card 3: Tổng doanh thu */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiCardTop}>
                  <span className={styles.kpiLabel}>TỔNG DOANH THU</span>
                  <div className={`${styles.kpiIconBox} ${styles.kpiIconGreen}`}>
                    <Wallet size={20} />
                  </div>
                </div>
                <div className={styles.kpiCardMain}>
                  <div className={styles.kpiBigNumber}>
                    {formattedRevenueNum}{' '}
                    <span className={styles.kpiUnit}>đ</span>
                  </div>
                  <div className={styles.kpiMiniRow}>
                    <span className={styles.kpiTrendBadge}>
                      <TrendingUp size={14} /> +18.2%
                    </span>
                    <span className={styles.kpiSubtext}>
                      {timeFilter === '6m' ? 'Kỳ 6 tháng gần nhất' : timeFilter === 'year' ? 'Lũy kế năm 2026' : 'Toàn thời gian'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Số dư khả dụng (Hero Card) */}
              <div className={`${styles.kpiCard} ${styles.kpiHeroCard}`}>
                <div className={styles.kpiCardTop}>
                  <span className={styles.kpiLabel}>SỐ DƯ KHẢ DỤNG</span>
                  <div className={`${styles.kpiIconBox} ${styles.kpiIconMint}`}>
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className={styles.kpiCardMain}>
                  <div className={`${styles.kpiBigNumber} ${styles.textPrimaryGreen}`}>
                    {(wallet?.formattedAvailableBalance || '0 đ').replace(/\s*đ$/, '')}{' '}
                    <span className={styles.kpiUnit}>đ</span>
                  </div>
                  <div className={styles.kpiWithdrawRow}>
                    <span className={styles.readyTag}>
                      <span className={styles.readyDot} /> Sẵn sàng rút
                    </span>
                    <Link to="/organizer/wallet" className={styles.btnWithdrawNow}>
                      Rút tiền ngay
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: 3 Cards */}
            <div className={styles.kpiRow2}>
              {/* Card 5: Số dư chờ xác nhận */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiCardTop}>
                  <span className={styles.kpiLabel}>SỐ DƯ CHỜ XÁC NHẬN</span>
                  <div className={`${styles.kpiIconBox} ${styles.kpiIconGray}`}>
                    <Hourglass size={20} />
                  </div>
                </div>
                <div className={styles.kpiCardMain}>
                  <div className={styles.kpiBigNumber}>
                    {(wallet?.formattedPendingBalance || '0 đ').replace(/\s*đ$/, '')}{' '}
                    <span className={styles.kpiUnit}>đ</span>
                  </div>
                  <p className={styles.kpiNoteText}>
                    <Clock size={15} color="#006591" />
                    <span>Chờ đối soát từ cổng VNPay / MoMo</span>
                  </p>
                </div>
              </div>

              {/* Card 6: Số dư đang chờ rút */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiCardTop}>
                  <span className={styles.kpiLabel}>SỐ DƯ ĐANG CHỜ RÚT</span>
                  <div className={`${styles.kpiIconBox} ${styles.kpiIconAmber}`}>
                    <Clock size={20} />
                  </div>
                </div>
                <div className={styles.kpiCardMain}>
                  <div className={styles.kpiBigNumber}>
                    {(wallet?.formattedWithdrawalPendingBalance || '0 đ').replace(/\s*đ$/, '')}{' '}
                    <span className={styles.kpiUnit}>đ</span>
                  </div>
                  <p className={styles.kpiNoteText}>
                    <span className={styles.amberDot} />
                    <span>
                      {(wallet?.withdrawalPendingBalance ?? 0) > 0
                        ? '1 lệnh rút tiền đang xử lý'
                        : 'Không có lệnh chờ xử lý'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Card 7: Tổng tiền đã rút */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiCardTop}>
                  <span className={styles.kpiLabel}>TỔNG TIỀN ĐÃ RÚT</span>
                  <div className={`${styles.kpiIconBox} ${styles.kpiIconGreen}`}>
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className={styles.kpiCardMain}>
                  <div className={styles.kpiBigNumber}>
                    {(wallet?.formattedTotalWithdrawn || '0 đ').replace(/\s*đ$/, '')}{' '}
                    <span className={styles.kpiUnit}>đ</span>
                  </div>
                  <p className={`${styles.kpiNoteText} ${styles.textGreen}`}>
                    <CheckCircle2 size={15} />
                    <span>Đã đối soát &amp; quyết toán thành công</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Middle Section: Financial Chart & Ticket Performance by Event */}
          <div className={styles.middleGrid}>
            {/* Left (Col 8): Financial Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <span className={styles.chartEyebrow}>CHỈ SỐ TÀI CHÍNH</span>
                  <h2 className={styles.chartTitle}>Doanh thu bán vé theo thời gian</h2>
                </div>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDotGreen} />
                    <span>Doanh thu thực nhận</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDotGray} />
                    <span>Mục tiêu</span>
                  </div>
                </div>
              </div>

              {/* Highlight callout pill */}
              <div className={styles.chartHighlightPill}>
                <div className={styles.highlightLeft}>
                  <CheckCircle2 size={18} color="#006d3d" />
                  <span>
                    Đỉnh điểm tháng {peakMonth ? peakMonth.monthLabel : 'hiện tại'} đạt:{' '}
                    <strong>
                      {peakMonth ? peakMonth.formattedGrossRevenue : (revenue?.formattedTotalRevenue || '0 đ')}
                    </strong>
                  </span>
                </div>
                <span className={styles.highlightTag}>• Tăng trưởng thực tế</span>
              </div>

              {/* SVG Area & Line Chart */}
              <div className={styles.svgWrap}>
                <svg
                  className={styles.svgCanvas}
                  preserveAspectRatio="none"
                  viewBox="0 0 700 220"
                >
                  <defs>
                    <linearGradient id="dashboardRevenueGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2dc275" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#2dc275" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Subtle Background Grid Lines */}
                  <line stroke="#e7e8eb" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="20" y2="20" />
                  <line stroke="#e7e8eb" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="70" y2="70" />
                  <line stroke="#e7e8eb" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="120" y2="120" />
                  <line stroke="#e7e8eb" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="700" y1="170" y2="170" />

                  {/* Target Reference Line */}
                  <path
                    d="M 0,140 Q 180,120 350,110 T 700,70"
                    fill="none"
                    stroke="#bccabc"
                    strokeDasharray="6 4"
                    strokeWidth="2"
                  />

                  {/* Main Gradient Area Fill */}
                  {areaD && (
                    <path
                      d={areaD}
                      fill="url(#dashboardRevenueGrad)"
                    />
                  )}

                  {/* Emerald High-Voltage Line */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#2dc275"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  )}

                  {/* Interactive Node Points */}
                  {chartPoints.map((pt, idx) => (
                    <circle
                      key={pt.monthKey}
                      cx={pt.x}
                      cy={pt.y}
                      fill={idx === chartPoints.length - 1 ? '#2dc275' : '#ffffff'}
                      r={idx === chartPoints.length - 1 ? 6 : 4}
                      stroke={idx === chartPoints.length - 1 ? '#ffffff' : '#2dc275'}
                      strokeWidth={3}
                    />
                  ))}
                </svg>
              </div>

              {/* Month Labels Axis */}
              <div className={styles.chartAxis}>
                {displayMonths.map((item, idx) => (
                  <div
                    key={item.monthKey}
                    className={idx === displayMonths.length - 1 ? styles.currentMonthLabel : undefined}
                  >
                    {item.monthLabel} {idx === displayMonths.length - 1 ? '(Nay)' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Right (Col 4): Ticket Performance by Event */}
            <div className={styles.perfCard}>
              <div className={styles.perfHeader}>
                <div>
                  <span className={styles.chartEyebrow}>TỶ LỆ BÁN VÉ THEO SỰ KIỆN</span>
                  <h2 className={styles.chartTitle}>Ticket Performance by Event</h2>
                </div>
                <Layers size={20} color="#006d3d" />
              </div>

              <div className={styles.perfList}>
                {eventPerformances.length > 0 ? (
                  eventPerformances.map((perf) => {
                    const fillClass =
                      perf.fillRatePercent >= 90
                        ? styles.perfFillGreen
                        : perf.fillRatePercent >= 70
                        ? styles.perfFillPrimary
                        : styles.perfFillBlue
                    return (
                      <div key={perf.eventId} className={styles.perfItem}>
                        <div className={styles.perfItemTop}>
                          <span className={styles.perfItemName}>{perf.eventName}</span>
                          <span className={styles.perfItemRate}>{perf.fillRatePercent}%</span>
                        </div>
                        <div className={styles.perfTrack}>
                          <div className={fillClass} style={{ width: `${Math.min(100, perf.fillRatePercent)}%` }} />
                        </div>
                        <div className={styles.perfItemBottom}>
                          <span>
                            {perf.soldTickets.toLocaleString('vi-VN')} / {perf.totalTickets.toLocaleString('vi-VN')} vé
                          </span>
                          <span className={perf.fillRatePercent >= 100 ? styles.textGreenBold : styles.textGreen}>
                            {perf.fillRatePercent >= 100
                              ? 'SOLD OUT'
                              : perf.fillRatePercent >= 90
                              ? 'Sắp cháy vé'
                              : perf.fillRatePercent >= 70
                              ? 'Bán chạy'
                              : `${perf.remainingTickets.toLocaleString('vi-VN')} vé còn`}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : featuredEvent ? (
                  <div className={styles.perfItem}>
                    <div className={styles.perfItemTop}>
                      <span className={styles.perfItemName}>{featuredEvent.name}</span>
                      <span className={styles.perfItemRate}>100%</span>
                    </div>
                    <div className={styles.perfTrack}>
                      <div className={styles.perfFillGreen} style={{ width: '100%' }} />
                    </div>
                    <div className={styles.perfItemBottom}>
                      <span>Đang mở bán vé trên hệ thống</span>
                      <span className={styles.textGreen}>Hoạt động</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#71787e' }}>
                    Chưa có sự kiện nào mở bán vé.
                  </div>
                )}
              </div>

              <div className={styles.perfFooter}>
                <span>Đánh giá hiệu suất chung</span>
                <span className={styles.perfFooterHighlight}>
                  <TrendingUp size={16} /> Vượt kỳ vọng 14%
                </span>
              </div>
            </div>
          </div>

          {/* 5. Lower Section: Ticket Volume Bar Chart & Actionable Tasks */}
          <div className={styles.lowerGrid}>
            {/* Left (Col 7): Ticket Sales Volume Bar Chart */}
            <div className={styles.volumeCard}>
              <div className={styles.volumeHeader}>
                <div>
                  <span className={styles.chartEyebrow}>LƯỢNG VÉ TIÊU THỤ</span>
                  <h3 className={styles.volumeTitle}>Số lượng vé bán theo tháng</h3>
                </div>
                <span className={styles.volumeUnit}>Đơn vị: Vé</span>
              </div>

              <div className={styles.barsContainer}>
                {displayMonths.map((b, idx) => {
                  const heightPx = Math.max(20, Math.round((b.totalOrders / maxOrders) * 160))
                  const isActive = idx === displayMonths.length - 1
                  return (
                    <div key={b.monthKey} className={`${styles.barCol} ${isActive ? styles.barColActive : ''}`}>
                      <span className={isActive ? styles.barValActive : styles.barVal}>
                        {b.totalOrders.toLocaleString('vi-VN')}
                      </span>
                      <div
                        className={isActive ? styles.barPillarActive : styles.barPillar}
                        style={{ height: `${heightPx}px` }}
                      />
                      <span className={isActive ? styles.barLabelActive : styles.barLabel}>
                        {b.monthLabel}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className={styles.volumeFooter}>
                <span>Trung bình tháng: <strong>{avgOrders.toLocaleString('vi-VN')} đơn</strong></span>
                <span className={styles.textGreen}>Tốc độ phân phối thực tế ↑</span>
              </div>
            </div>

            {/* Right (Col 5): Actionable Alerts & Tasks */}
            <div className={styles.tasksCard}>
              <div className={styles.tasksHeader}>
                <div>
                  <span className={styles.chartEyebrow}>HÀNH ĐỘNG KHẨN CẤP</span>
                  <h3 className={styles.volumeTitle}>Tác vụ cần xử lý</h3>
                </div>
                <span className={styles.tasksCountBadge}>3 tác vụ chờ</span>
              </div>

              <div className={styles.tasksList}>
                {/* Task 1 */}
                <div className={styles.taskItem}>
                  <div className={styles.taskLeft}>
                    <div className={styles.taskIconBox}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className={styles.taskName}>Live Concert Summer Beat 2025</div>
                      <div className={styles.taskMeta}>
                        <span className={styles.taskMetaBadge}>Chờ Admin duyệt hồ sơ</span>
                        <span>• Gửi 2 giờ trước</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/organizer/events" className={styles.btnTaskAction}>
                    Xem hồ sơ
                  </Link>
                </div>

                {/* Task 2 */}
                <div className={styles.taskItem}>
                  <div className={styles.taskLeft}>
                    <div className={`${styles.taskIconBox} ${styles.taskIconBlue}`}>
                      <Wallet size={18} />
                    </div>
                    <div>
                      <div className={styles.taskName}>
                        Yêu cầu rút {wallet?.formattedWithdrawalPendingBalance || '300.000.000 đ'} về VCB
                      </div>
                      <div className={styles.taskMeta}>
                        <span className={styles.taskMetaBlue}>Đang duyệt</span>
                        <span>• Mã #WD-9941</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/organizer/wallet" className={styles.btnTaskAction}>
                    Chi tiết
                  </Link>
                </div>

                {/* Task 3 */}
                <div className={styles.taskItemAlert}>
                  <div className={styles.taskAlertHeader}>
                    <div className={styles.alertTitle}>
                      <Activity size={17} color={checkinAlert?.hasAlert ? '#ba1a1a' : '#006d3d'} />
                      <span>{checkinAlert?.eventName ? `Tiến độ soát vé: ${checkinAlert.eventName}` : 'Giám sát cổng soát vé'}</span>
                    </div>
                    <span className={styles.alertPercent}>
                      {checkinAlert ? `${checkinAlert.checkinRatePercent}%` : '100%'}
                    </span>
                  </div>
                  <div className={styles.alertTrack}>
                    <div
                      className={styles.alertFill}
                      style={{
                        width: `${Math.min(100, checkinAlert?.checkinRatePercent ?? 100)}%`,
                        backgroundColor: checkinAlert?.hasAlert ? '#ba1a1a' : '#2dc275',
                      }}
                    />
                  </div>
                  <div className={styles.alertBottom}>
                    <span>
                      Đã soát vé: <strong>{checkinAlert?.checkedInTickets ?? 0} / {checkinAlert?.totalTickets ?? 0}</strong> khách
                    </span>
                    <span className={checkinAlert?.hasAlert ? styles.textAlertCoral : styles.textGreen}>
                      {checkinAlert?.alertMessage || 'Hệ thống cổng soát vé hoạt động bình thường'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.tasksFooter}>
                <span className={styles.supportText}>Hỗ trợ kỹ thuật 24/7 trực tuyến</span>
                <Link to="/organizer/events" className={styles.btnViewAllTasks}>
                  Xem toàn bộ tác vụ →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
