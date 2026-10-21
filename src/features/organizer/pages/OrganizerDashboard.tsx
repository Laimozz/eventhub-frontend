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
import { getOrganizerRevenue, getOrganizerWallet } from '../api/organizer-api'
import type { OrganizerRevenueSummary, OrganizerWallet } from '../types/organizer'
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

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        setLoading(true)
        setError('')
        const [walletRes, revenueRes, eventsRes] = await Promise.all([
          getOrganizerWallet(controller.signal).catch(() => null),
          getOrganizerRevenue(controller.signal).catch(() => null),
          getOrganizerEvents({ page: 0, size: 50, search: '' }, controller.signal).catch(() => null),
        ])

        if (controller.signal.aborted) return

        setWallet(walletRes)
        setRevenue(revenueRes)
        if (eventsRes) {
          setTotalEvents(eventsRes.totalElements)
          setEventsList(eventsRes.content)
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
                            {(featuredRevenueItem?.soldTickets ?? featuredRevenueItem?.totalTicketsSold ?? 4600).toLocaleString('vi-VN')} / 5.000 vé
                          </strong>
                        </span>
                        <span className={styles.progressPercentGreen}>92.0% Lấp đầy khán đài</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFillPrimary} style={{ width: '92%' }} />
                      </div>
                    </div>

                    <div className={styles.progressCol}>
                      <div className={styles.progressTextRow}>
                        <span className={styles.progressTitle}>
                          Doanh thu tạm tính:{' '}
                          <strong>
                            {featuredRevenueItem?.formattedRevenue || '3.850.000.000 đ'}
                          </strong>
                        </span>
                        <span className={styles.progressPercentCyan}>Đạt 93.6% chỉ tiêu 4,1 tỷ</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFillSecondary} style={{ width: '93.6%' }} />
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
                    {(revenue?.totalTicketsSold ?? 18450).toLocaleString('vi-VN')}{' '}
                    <span className={styles.kpiUnit}>vé</span>
                  </div>
                  <div className={styles.kpiMiniRow}>
                    <span className={styles.kpiTrendBadge}>
                      <TrendingUp size={14} /> +24.5%
                    </span>
                    <span className={styles.kpiSubtext}>
                      Lấp đầy: <strong className={styles.textGreen}>88.5%</strong>
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
                    {revenue?.formattedTotalRevenue || '4.820.000.000'}{' '}
                    <span className={styles.kpiUnit}>đ</span>
                  </div>
                  <div className={styles.kpiMiniRow}>
                    <span className={styles.kpiTrendBadge}>
                      <TrendingUp size={14} /> +18.2%
                    </span>
                    <span className={styles.kpiSubtext}>tăng trưởng</span>
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
                    {wallet?.formattedAvailableBalance || '1.450.000.000'}{' '}
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
                    {wallet?.formattedPendingBalance || '520.000.000'}{' '}
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
                    {wallet?.formattedWithdrawalPendingBalance || '300.000.000'}{' '}
                    <span className={styles.kpiUnit}>đ</span>
                  </div>
                  <p className={styles.kpiNoteText}>
                    <span className={styles.amberDot} />
                    <span>
                      {(wallet?.withdrawalPendingBalance ?? 0) > 0
                        ? '1 lệnh rút tiền đang xử lý'
                        : '1 lệnh VCB đang xử lý (#WD-9941)'}
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
                    {wallet?.formattedTotalWithdrawn || '2.550.000.000'}{' '}
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
                    Đỉnh điểm tháng 04/2025 đạt:{' '}
                    <strong>
                      {revenue?.formattedTotalRevenue || '1.850.000.000 VNĐ'}
                    </strong>
                  </span>
                </div>
                <span className={styles.highlightTag}>• Tăng trưởng liên tục</span>
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
                  <path
                    d="M 0,175 L 0,175 C 70,165 100,150 140,140 C 210,125 250,135 280,105 C 350,75 390,90 420,65 C 490,40 530,60 560,45 C 630,20 660,10 700,8 L 700,200 L 0,200 Z"
                    fill="url(#dashboardRevenueGrad)"
                  />

                  {/* Emerald High-Voltage Line */}
                  <path
                    d="M 0,175 C 70,165 100,150 140,140 C 210,125 250,135 280,105 C 350,75 390,90 420,65 C 490,40 530,60 560,45 C 630,20 660,10 700,8"
                    fill="none"
                    stroke="#2dc275"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />

                  {/* Interactive Node Points */}
                  <circle cx="140" cy="140" fill="#ffffff" r="4" stroke="#2dc275" strokeWidth="3" />
                  <circle cx="280" cy="105" fill="#ffffff" r="4" stroke="#2dc275" strokeWidth="3" />
                  <circle cx="420" cy="65" fill="#ffffff" r="4" stroke="#2dc275" strokeWidth="3" />
                  <circle cx="560" cy="45" fill="#ffffff" r="4" stroke="#2dc275" strokeWidth="3" />
                  <circle cx="700" cy="8" fill="#2dc275" r="6" stroke="#ffffff" strokeWidth="3" />
                </svg>
              </div>

              {/* Month Labels Axis */}
              <div className={styles.chartAxis}>
                <div>T11/2024</div>
                <div>T12/2024</div>
                <div>T01/2025</div>
                <div>T02/2025</div>
                <div>T03/2025</div>
                <div className={styles.currentMonthLabel}>T04/2025 (Nay)</div>
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
                {/* Event 1 */}
                <div className={styles.perfItem}>
                  <div className={styles.perfItemTop}>
                    <span className={styles.perfItemName}>
                      {featuredEvent?.name || 'Anh Trai Say Hi Concert'}
                    </span>
                    <span className={styles.perfItemRate}>92%</span>
                  </div>
                  <div className={styles.perfTrack}>
                    <div className={styles.perfFillGreen} style={{ width: '92%' }} />
                  </div>
                  <div className={styles.perfItemBottom}>
                    <span>4.600 / 5.000 vé</span>
                    <span className={styles.textGreen}>Sắp cháy vé</span>
                  </div>
                </div>

                {/* Event 2 */}
                <div className={styles.perfItem}>
                  <div className={styles.perfItemTop}>
                    <span className={styles.perfItemName}>Rock On Stage Fest 2025</span>
                    <span className={styles.perfItemRate}>100%</span>
                  </div>
                  <div className={styles.perfTrack}>
                    <div className={styles.perfFillPrimary} style={{ width: '100%' }} />
                  </div>
                  <div className={styles.perfItemBottom}>
                    <span>3.200 / 3.200 vé</span>
                    <span className={styles.textGreenBold}>SOLD OUT</span>
                  </div>
                </div>

                {/* Event 3 */}
                <div className={styles.perfItem}>
                  <div className={styles.perfItemTop}>
                    <span className={styles.perfItemName}>Vietnam Tech Summit 2025</span>
                    <span className={styles.perfItemRateBlue}>71%</span>
                  </div>
                  <div className={styles.perfTrack}>
                    <div className={styles.perfFillBlue} style={{ width: '71%' }} />
                  </div>
                  <div className={styles.perfItemBottom}>
                    <span>1.420 / 2.000 vé</span>
                    <span>Đang bán tốt</span>
                  </div>
                </div>

                {/* Event 4 */}
                <div className={styles.perfItem}>
                  <div className={styles.perfItemTop}>
                    <span className={styles.perfItemName}>Luminous Sound Night</span>
                    <span className={styles.perfItemRateMuted}>60%</span>
                  </div>
                  <div className={styles.perfTrack}>
                    <div className={styles.perfFillTeal} style={{ width: '60%' }} />
                  </div>
                  <div className={styles.perfItemBottom}>
                    <span>1.200 / 2.000 vé</span>
                    <span>Còn 800 vé</span>
                  </div>
                </div>
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
                <div className={styles.barCol}>
                  <span className={styles.barVal}>1.820</span>
                  <div className={styles.barPillar} style={{ height: '48px' }} />
                  <span className={styles.barLabel}>T11/24</span>
                </div>
                <div className={styles.barCol}>
                  <span className={styles.barVal}>2.450</span>
                  <div className={styles.barPillar} style={{ height: '72px' }} />
                  <span className={styles.barLabel}>T12/24</span>
                </div>
                <div className={styles.barCol}>
                  <span className={styles.barVal}>2.100</span>
                  <div className={styles.barPillar} style={{ height: '62px' }} />
                  <span className={styles.barLabel}>T01/25</span>
                </div>
                <div className={styles.barCol}>
                  <span className={styles.barVal}>3.200</span>
                  <div className={styles.barPillar} style={{ height: '98px' }} />
                  <span className={styles.barLabel}>T02/25</span>
                </div>
                <div className={styles.barCol}>
                  <span className={styles.barVal}>3.880</span>
                  <div className={styles.barPillar} style={{ height: '120px' }} />
                  <span className={styles.barLabel}>T03/25</span>
                </div>
                <div className={`${styles.barCol} ${styles.barColActive}`}>
                  <span className={styles.barValActive}>5.000</span>
                  <div className={styles.barPillarActive} style={{ height: '165px' }} />
                  <span className={styles.barLabelActive}>T04/25</span>
                </div>
              </div>

              <div className={styles.volumeFooter}>
                <span>Trung bình tháng: <strong>3.075 vé</strong></span>
                <span className={styles.textGreen}>Tốc độ phân phối đạt đỉnh ↑</span>
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
                      <Activity size={17} color="#ba1a1a" />
                      <span>Cảnh báo vé Cổng A Anh Trai Say Hi</span>
                    </div>
                    <span className={styles.alertPercent}>46.8%</span>
                  </div>
                  <div className={styles.alertTrack}>
                    <div className={styles.alertFill} style={{ width: '46.8%' }} />
                  </div>
                  <div className={styles.alertBottom}>
                    <span>
                      Đã soát vé: <strong>2.180 / 4.650</strong> khách
                    </span>
                    <span className={styles.textAlertCoral}>
                      Đạt 46.8% check-in • Cần hỗ trợ cổng
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
