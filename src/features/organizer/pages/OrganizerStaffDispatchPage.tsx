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
import { eventDate } from '../../events/event-display'
import type { EventSummary } from '../../events/types/event'
import styles from './OrganizerStaffDispatchPage.module.css'

export function OrganizerStaffDispatchPage() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const controller = new AbortController()

    getOrganizerEvents({ page: 0, size: 50, search }, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setEvents(res.content)
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
                {String(events.length || 4).padStart(2, '0')}
              </span>
              <span className={styles.kpiUnit}>sự kiện</span>
            </div>
            <p className={styles.kpiSub}>1 sự kiện chuẩn bị bắt đầu hôm nay</p>
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
              <span className={styles.kpiNumber}>28</span>
              <span className={styles.kpiMutedUnit}>/ 32 nhân sự</span>
            </div>
            <p className={`${styles.kpiSub} ${styles.textWarning}`}>
              <AlertCircle size={14} />
              <span>Cần bổ sung thêm 4 người</span>
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
              <span className={styles.kpiNumber}>12</span>
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
              <span className={`${styles.kpiNumber} ${styles.textGreen}`}>76.4%</span>
              <span className={styles.kpiSubMini}>tốc độ 45 vé/phút</span>
            </div>
            <div className={styles.kpiTrack}>
              <div className={styles.kpiFill} style={{ width: '76.4%' }} />
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
          {filteredEvents.map((event, idx) => {
            const isFinished = event.status === 'COMPLETED' || event.status === 'CANCELED'
            const isNeedStaff = !isFinished && idx === 2
            const isFullyStaffed = !isFinished && idx === 1

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
                          SẮP DIỄN RA • CÒN 13 NGÀY
                        </span>
                      ) : isFullyStaffed ? (
                        <span className={styles.badgeSelling}>
                          <Calendar size={13} />
                          ĐANG MỞ BÁN • CÒN 5 NGÀY
                        </span>
                      ) : (
                        <span className={styles.badgeLive}>
                          <span className={styles.coralPulse} />
                          SẮP DIỄN RA • HÔM NAY 19:30
                        </span>
                      )}
                      <span className={styles.eventCode}>#EVT-{event.id}</span>
                    </div>

                    {/* Staff Allocation Warning/Status Badge */}
                    {isFinished ? (
                      <span className={styles.staffBadgeMuted}>Hoàn tất ca: 10/10 Staff</span>
                    ) : isNeedStaff ? (
                      <span className={styles.staffBadgeError}>
                        <AlertCircle size={14} />
                        0/8 Staff đã phân công (Cần bố trí)
                      </span>
                    ) : isFullyStaffed ? (
                      <span className={styles.staffBadgeSuccess}>
                        <CheckCircle2 size={14} />
                        Đã đủ nhân sự: 6/6 Staff
                      </span>
                    ) : (
                      <span className={styles.staffBadgeWarning}>
                        <Users size={14} />
                        Đã phân công: 8/10 Staff (Cần thêm 2)
                      </span>
                    )}
                  </div>

                  {/* Media & Details Row */}
                  <div className={styles.cardBodyRow}>
                    <div className={styles.posterWrap}>
                      <img
                        src={
                          event.thumbnailImageUrl ||
                          (idx === 1
                            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHFJsW-QJ3h_rQzZq61kcnuKw6E5pdrbh--x-o5NwOGlp0zIMKfpv5V_gA9rImoopVmPKPuUnkyxRNhnyuxE66LwHggLC3J1Z5kEsqySMKXSYAf6cpNrjLXTiYxEWZSVKm_yEcub58wh8v036TU60trVtvLLyrJ9OGbzkhwv2fa5zw8HB2Qz8__yduHY5Yb66Vcibtln7uTX0p8qO3o6bllX47sZIhBnTav_nwiYDZnqQM3RuZeVnP'
                            : idx === 2
                            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgHUesQpSYjVuFq3cDiU6dU__zP936vdW13X2eDyZGGJvkdz5pcHSlK2wRiGiXgjFb7U2hBPAWqiclFrN1vk0GEmFlyL1Xh6j5vXmpMQed3zs6I1RONIqBgmupXRWTTgubM_PfmMSeefb-JMuqj66Z2hsvk5_bK9_Ic0omzVcUFKamAUQb2qzyyfclQJVSVaJZ13lit0miY85i5jX3rK82bFcnhJnVOXWqEKGmv7vBYtwWbFKrCK6h'
                            : isFinished
                            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZq_zKJfyO8dOMw-KFviE16f5tOuTZkBKnGQ2OPq3c_dzsuxNu3VhObn5SiaCEdhijAR3Bl2v8H6Pz7wNOVLHlcfpffBkBOHiu5n4ZhcjSyNLESFBN1oBl3gvOX97DNBmpJlCzncQDAj-sUVR5XXYfa_6vwBSPveiiORcuhVN2pyQnOLMjQNls_6JKJgBcqjcz5OdmGodgLmQChkdLAtAoYllsdQgAf1xyovD5qPsguQsByTVDThF4'
                            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxnnKURbsmqsLu5Fc1GYiWTJHf5Oq1ee_Kv9dQo4Hk_e_AlFyRUqCkxL473qJTORXQqN3PmX8j8DbnEyIYXFnaC3Aq2njvLHQH0dahUk2QEEsic47uv-78aghEpLjwo9DTnq7-cYQPH2vkq4_RnE6SkdI7cMX6n3VuKXhFcdoGm67U_hE_waR73QM5DH6LYvmXbC9lu1rjKNHSh5YbaJgveZcaGmzcFEU9BpMep41WP18qxiAkG_15')
                        }
                        alt={event.name}
                        className={styles.posterImg}
                      />
                      <span className={styles.posterCategory}>
                        {event.categoryName || (idx === 1 ? 'Music Fest' : idx === 2 ? 'Tech Summit' : isFinished ? 'Street Festival' : 'Live Concert')}
                      </span>
                    </div>

                    <div className={styles.eventInfo}>
                      <h2 className={styles.eventTitle}>{event.name}</h2>
                      <div className={styles.metaList}>
                        <div className={styles.metaItem}>
                          <Calendar size={16} className={styles.metaIconPrimary} />
                          <span className={styles.metaTextBold}>
                            {eventDate(event.startTime)} • {isFinished ? 'Đã kết thúc ca trực' : '19:30 - 23:30'}
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
                            {isFinished ? (
                              <>Tỷ lệ check-in: <b style={{ color: '#006d3d' }}>98.2%</b> (4.120 / 4.200 vé)</>
                            ) : isFullyStaffed ? (
                              <>Quy mô: <b>3.200 vé</b> (Đã bán 89%)</>
                            ) : isNeedStaff ? (
                              <>Quy mô: <b>1.500 vé</b> (Đã bán 72%)</>
                            ) : (
                              <>Quy mô: <b>5.000 vé</b> (Đã bán hết 100%)</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gates & Staffing Distribution breakdown */}
                  {isFinished ? (
                    <div className={styles.pastResultsBox}>
                      <div className={styles.gatesHeader}>
                        <span className={styles.gatesTitle}>Kết quả vận hành cổng:</span>
                        <span className={styles.gatesTarget}>Tổng thời gian soát vé: 6 giờ</span>
                      </div>
                      <div className={styles.pastResultRow}>
                        <div className={styles.pastResultLeft}>
                          <ShieldCheck size={18} className={styles.metaIconPrimary} />
                          <span>Không phát hiện trường hợp vé giả lọt cổng</span>
                        </div>
                        <span className={styles.metaTextBold} style={{ color: '#006d3d' }}>
                          Đánh giá vận hành: 4.9/5 ★
                        </span>
                      </div>
                    </div>
                  ) : isNeedStaff ? (
                    <div className={styles.calloutAlert}>
                      <AlertCircle size={20} className={styles.calloutIcon} />
                      <div>
                        <h4 className={styles.calloutTitle}>Chưa chỉ định nhân sự điều phối và quét mã</h4>
                        <p className={styles.calloutDesc}>
                          Sự kiện yêu cầu tối thiểu 8 nhân sự cho 2 cửa hội trường Grand Ballroom, khu vực Check-in thẻ đeo VIP và khu vực Workshop tầng 5.
                        </p>
                      </div>
                    </div>
                  ) : isFullyStaffed ? (
                    <div className={styles.gatesBox}>
                      <div className={styles.gatesHeader}>
                        <span className={styles.gatesTitle}>3 Cửa kiểm soát vé sẵn sàng:</span>
                        <span className={styles.gatesTarget}>Đã cấu hình thiết bị POS</span>
                      </div>
                      <div className={styles.gatesGrid3}>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Cổng Check-in VIP</div>
                          <div className={styles.gateStaffVal}>2 Staff đã nhận ca</div>
                        </div>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Cổng GA Zone A</div>
                          <div className={styles.gateStaffVal}>2 Staff đã nhận ca</div>
                        </div>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Cổng GA Zone B</div>
                          <div className={styles.gateStaffVal}>2 Staff đã nhận ca</div>
                        </div>
                      </div>
                      <div className={styles.staffAvatarsRow}>
                        <div className={styles.avatarGroup}>
                          <div className={styles.avatarStack}>
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIpyk5YdWxqhcK2aJ5NB7NJaZJMybdoOYA0YUrZmkZwn7n0Ii2ggyqaiVjKNbB13VqZrhjPVic1cJlYNdOKql2aEORPbBZA07dm05Oz2URc-fSG7RW5uSJ2EpPE8zQXHrGG33zPuM2JApccnY0xkvHC3qKULt2HLgiAcrGQmnRnaxcFxwSiQfjnKi1bWv_-j_M3zYNqBmOEyZJVP_eYAyspcV5nFGQw651aqT64fZJ0sKBSaLeqBWH"
                              alt="Staff"
                              className={styles.avatarImg}
                            />
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoUtSedHuc5hK27Vnv0268eJq0F6QjCn135sxFQT0DIaCF5aDwoYzaSWtfW1YSFNnGA79It-fZjgjwj3P0x6EPEV0GCoAV5N9A7AL5F6Zlnj3u2rgLJpnFAqRvVFZ5E0cwZzWFrupya6DQyKgMje2eekiwKXrnmnLOmyLZtN1Zn4GOi81WT6PIKqmtKS4Bb15gbl2XEaiZE6nXR9svIDH4BPN7wQBAjrr84hrio6_koe31rTthmXLc"
                              alt="Staff"
                              className={styles.avatarImg}
                            />
                            <span className={styles.avatarMore}>+4</span>
                          </div>
                          <span className={styles.staffNames}>
                            Đội trưởng ca: Hoàng Đình Trọng (Lead Scanner)
                          </span>
                        </div>
                        <span className={styles.textSecondaryStatus}>
                          Tự động khóa vé trùng
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.gatesBox}>
                      <div className={styles.gatesHeader}>
                        <span className={styles.gatesTitle}>Bố trí 4 Cổng soát vé:</span>
                        <span className={styles.gatesTarget}>
                          Tốc độ quét mục tiêu: &lt; 3 giây/vé
                        </span>
                      </div>

                      <div className={styles.gatesGrid}>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Cổng A (VIP)</div>
                          <div className={styles.gateStaffVal}>2/2 Staff</div>
                          <div className={styles.gateSub}>2 Làn scanner</div>
                        </div>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Cổng B (GA)</div>
                          <div className={`${styles.gateStaffVal} ${styles.textCoral}`}>
                            3/4 Staff
                          </div>
                          <div className={`${styles.gateSub} ${styles.textCoral}`}>
                            Thiếu 1 người
                          </div>
                        </div>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Cổng C (Khán đài)</div>
                          <div className={`${styles.gateStaffVal} ${styles.textCoral}`}>
                            2/3 Staff
                          </div>
                          <div className={`${styles.gateSub} ${styles.textCoral}`}>
                            Thiếu 1 người
                          </div>
                        </div>
                        <div className={styles.gateCol}>
                          <div className={styles.gateLabel}>Cổng D (CSKH)</div>
                          <div className={styles.gateStaffVal}>1/1 Staff</div>
                          <div className={styles.gateSub}>Giải quyết lỗi vé</div>
                        </div>
                      </div>

                      {/* Assigned Staff Avatars */}
                      <div className={styles.staffAvatarsRow}>
                        <div className={styles.avatarGroup}>
                          <div className={styles.avatarStack}>
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDf8uqBKtDcbP1eIcR8A7dSZ5g6mN_ZyhsKZ_38CrD4m3iaghhRPAKtfHiEGajlP-XiooTB6cUQ6xv23npmfwXAUtuHM_NcCyJkGe2LCLqXcWCetoYS0EVRNeHEeElo_3ce8XvGmEhnmY6iuU9_tBcw3J-wHAmSCMbOZCKFOHIAUDIcKHIyHoi-NrtI7Huyhu-R2Ol2_cFPwhsxO_PO_hsYg-8OJN7whc4RYfhdYmcvIauiZHbCfHRq"
                              alt="Staff"
                              className={styles.avatarImg}
                            />
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCx5tDazy8l28tp6rovs0Gjfspa_UcFU2_2asdHj9Xc9j5fEyojA_lNlQCIFQQyAnb4lhrozsiJgvcQAoBnNExEJwL3xCfKWoFGV5hEQm7YrXVhFffk-5iB_af0CDInof7gGnQetcB6d8Kk2KylFYB66DyQF6vhsFYrnLPzVNkyZHxZo-6SJsHFGqXyJyb0S6-wZx8Bc7AzF8md2M7d2RF_US9rHSGa213OhR6knq3LSiTYZo9vb1T"
                              alt="Staff"
                              className={styles.avatarImg}
                            />
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXP_-2Rb1osaLiac0hWNdXw22a0fbUp8vDYyq_14swjjOwaOXEbhAOWqLf-ZgYBzhf6Z1KA6GMPL5aEWpxdVlZQn2Gu_RcRDXjHzbpAL6QovA2j_yhxf0ElCflMHkZvhgsUbROgKUGgfjeYbMQcgB2mTAW66xEC1EumYaHOCD3SyQ-ZO1eT0X4zB_nkkAAtljzQ6unZIzATY5nOo6K3CN3IK3EGsPJjEWzbiVbJJeSpMZm8tR5KjIy"
                              alt="Staff"
                              className={styles.avatarImg}
                            />
                            <span className={styles.avatarMore}>+5</span>
                          </div>
                          <span className={styles.staffNames}>
                            Nguyễn Văn Hùng, Trần Hoàng Nam, Lê Thị Mai Phương...
                          </span>
                        </div>
                        <span className={styles.textActiveStatus}>
                          Tất cả tài khoản đã active app
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
