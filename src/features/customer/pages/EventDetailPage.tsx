import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { getPublicEventDetail } from '../api/event-api'
import type { PublicEventDetailResponse } from '../types/event'
import { utcDate } from '../booking-display'
import { customerEventState, ticketSalesLabels } from '../event-sales'
// import { useAuth } from '../../auth/hooks/useAuth'
import { EventCard } from '../components/EventCard'
import { CustomerHeader } from '../components/CustomerHeader'
import styles from './EventDetailPage.module.css'

export function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  // const { user } = useAuth()
  const [event, setEvent] = useState<PublicEventDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tạm thời comment ghi nhận dwell time vì hệ thống AI đang bảo trì sửa chữa
  /*
  useEffect(() => {
    const startTime = Date.now()
    const id = Number(eventId)
    if (!id) return

    return () => {
      const dwellSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000))
      recordEventInteraction({
        userId: user?.id,
        eventId: id,
        actionType: 'VIEW',
        dwellSeconds
      })
    }
  }, [eventId, user?.id])
  */

  useEffect(() => {
    let active = true
    async function fetchEvent() {
      if (!eventId) return
      setLoading(true)
      setError('')
      setEvent(null)
      try {
        const data = await getPublicEventDetail(Number(eventId))
        if (active) setEvent(data)
      } catch {
        if (active) setError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void fetchEvent()
    return () => { active = false }
  }, [eventId])

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Đang tải thông tin sự kiện...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className={styles.loadingWrapper}>
        <p role="alert">{error || 'Không tìm thấy sự kiện.'}</p>
        <Link to="/" className={styles.buyButton} style={{ width: 'auto', padding: '0 24px' }}>Về trang chủ</Link>
      </div>
    )
  }

  const state = customerEventState(event)
  const ticketTypes = event.ticketTypes || []
  const startDate = utcDate(event.startTime)
  const endDate = utcDate(event.endTime)
  const timeZone = 'Asia/Ho_Chi_Minh'

  const monthText = `Tháng ${startDate.toLocaleDateString('vi-VN', { month: 'numeric', timeZone })}`
  const dayText = startDate.toLocaleDateString('vi-VN', { day: '2-digit', timeZone })
  const yearText = startDate.toLocaleDateString('vi-VN', { year: 'numeric', timeZone })

  const formattedStartTime = startDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit', timeZone
  }) + ' • ' + startDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric', timeZone
  })

  const formattedEndTime = endDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit', timeZone
  }) + ' • ' + endDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric', timeZone
  })

  const formattedPrice = event.startingPrice 
    ? `Từ ${new Intl.NumberFormat('vi-VN').format(event.startingPrice)} VNĐ`
    : 'Miễn phí'

  const handleBookTicket = () => {
    if (state.canBook) navigate(`/customer/events/${event.id}/book`)
  }

  return (
    <div className={styles.page}>
      <CustomerHeader />
      <main className={styles.mainContent}>
        {/* HERO / EVENT BANNER */}
        <section className={styles.heroSection}>
        <div className={styles.heroGlow1}></div>
        <div className={styles.heroGlow2}></div>
        
        <div className={styles.heroContainer}>
          {/* Breadcrumb Bar */}
          <nav className={styles.breadcrumb}>
            <Link to="/">Khám phá</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className={styles.breadcrumbActive}>{event.name}</span>
          </nav>

          {/* Main Event Hero Split */}
          <div className={styles.heroSplit}>
            
            {/* Poster */}
            <div className={styles.posterColumn}>
              <div className={styles.posterWrapper}>
                <img 
                  src={event.bannerImageUrl || event.thumbnailImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'} 
                  alt={event.name} 
                  className={styles.posterImage} 
                />
                <div className={styles.posterGradient}></div>

                {/* Date Chip */}
                <div className={styles.dateChip}>
                  <span className={styles.dateChipMonth}>{monthText}</span>
                  <span className={styles.dateChipDay}>{dayText}</span>
                  <span className={styles.dateChipYear}>{yearText}</span>
                </div>

                {/* Status Badge */}
                <div className={styles.statusBadge}>
                  <span className={styles.statusBadgeInner}>
                    {state.eventLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Details Overview */}
            <div className={styles.detailsColumn}>
              <div className={styles.tagsContainer}>
                <span className={styles.tagPrimary}>MEGA LIVE EVENT</span>
                <span className={styles.tagSecondary}>{event.categoryName || 'Sự kiện'}</span>
                <span className={styles.tagTertiary}>Quy chuẩn 16+</span>
              </div>
              
              <h1 className={styles.heroTitle}>{event.name}</h1>

              {/* Meta Specs List */}
              <div className={styles.metaList}>
                {/* Organizer */}
                <div className={styles.metaItem}>
                  <div className={styles.metaIconBox}>
                    <span className="material-symbols-outlined text-[24px] text-[#2dc275]">verified_user</span>
                  </div>
                  <div className={styles.metaContent}>
                    <span className={styles.metaLabel}>Ban tổ chức</span>
                    <span className={styles.metaValueMain}>{event.organizerName || 'TicketBox'}</span>
                  </div>
                </div>

                {/* DateTime */}
                <div className={styles.metaItem}>
                  <div className={styles.metaIconBox}>
                    <span className="material-symbols-outlined text-[24px] text-[#72fca9]">schedule</span>
                  </div>
                  <div className={styles.metaContent}>
                    <span className={styles.metaLabel}>Thời gian sự kiện</span>
                    <span className={styles.metaValueMain}>Bắt đầu: {formattedStartTime}</span>
                    <span className={styles.metaValueSub}>Kết thúc: {formattedEndTime}</span>
                  </div>
                </div>

                {/* Venue */}
                <div className={styles.metaItem}>
                  <div className={styles.metaIconBox}>
                    <span className="material-symbols-outlined text-[24px] text-[#89ceff]">stadium</span>
                  </div>
                  <div className={styles.metaContent}>
                    <span className={styles.metaLabel}>Địa điểm tổ chức</span>
                    <span className={styles.metaValueMain}>{event.venue?.city || 'Đang cập nhật'}</span>
                    <span className={styles.metaValueSub}>{event.venue?.address || ''}</span>
                  </div>
                </div>
              </div>

              {/* Price & CTA Hero */}
              <div className={styles.heroFooter}>
                <div>
                  <span className={styles.priceLabel}>Mức giá vé chính thức:</span>
                  <span className={styles.priceValueHero}>{formattedPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT & TICKET BOOKING AREA */}
      <section className={styles.mainSection}>
        <div className={styles.mainContainer}>
          <div className={styles.contentGrid}>
            
            {/* LEFT COLUMN: Giới thiệu & Sơ đồ */}
            <div className={styles.leftColumn}>
              
              {/* Giới thiệu sự kiện */}
              <div className={styles.cardBox}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.titleAccent}></span>
                  Giới thiệu sự kiện
                </h2>
                <div className={styles.descriptionText}>
                  <p>{event.description}</p>
                </div>
              </div>

              {/* Sơ đồ tham khảo (Floor Map) */}
              {(event.imageZoneUrl || event.floorMapSvg) && (
                <div className={styles.cardBox}>
                  <div className={styles.sectionHeaderFlex}>
                    <h2 className={styles.sectionTitle}>
                      <span className={styles.titleAccentAlt}></span>
                      Sơ đồ phân khu tham khảo (Floor Map)
                    </h2>
                    <span className={styles.badgeNeutral}>Không chọn số ghế</span>
                  </div>

                  <div className={styles.alertNotice}>
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span><strong>Lưu ý:</strong> Đây chỉ là hình ảnh sơ đồ phân khu tham khảo vị trí sân khấu. Sự kiện áp dụng hình thức vé theo khu vực, không chọn số ghế cụ thể.</span>
                  </div>

                  <div className={styles.mapContainer}>
                    {event.floorMapSvg ? (
                      <div dangerouslySetInnerHTML={{ __html: event.floorMapSvg }} className={styles.mapImage} />
                    ) : (
                      <img src={event.imageZoneUrl as string} alt="Sơ đồ phân khu" className={styles.mapImage} />
                    )}
                  </div>
                  
                  {/* Floor Legend */}
                  <div className={styles.legendContainer}>
                    {ticketTypes.map(type => <div key={type.id} className={styles.legendItem}>
                      <span>{type.name} ({new Intl.NumberFormat('vi-VN').format(type.price)} VNĐ)</span>
                    </div>)}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: KHU VỰC VÉ */}
            <aside className={styles.rightColumn}>
              <div className={styles.bookingBox}>
                
                {/* Sticky Box Header */}
                <div className={styles.bookingHeader}>
                  <div className={styles.bookingHeaderLeft}>
                    <h3 className={styles.bookingTitle}>Khu vực vé</h3>
                    <span className={styles.bookingSubtitle}>Đứng & ngồi tự do theo phân khu</span>
                  </div>
                  <span className={styles.statusBadgeSmall}>
                    {state.canBook && <span className={styles.pulseDotAlt}></span>}{state.salesLabel}
                  </span>
                </div>

                {/* TICKET CARDS LIST */}
                <div className={styles.ticketList}>
                  {ticketTypes.map(type => <div key={type.id} className={styles.ticketCard}>
                    <div className={styles.ticketCardHeader}>
                      <div className={styles.ticketCardInfo}>
                        <div className={styles.ticketCardTitleWrapper}>
                          <h4 className={styles.ticketName}>{type.name}</h4>
                        </div>
                        <span className={styles.ticketPrice}>{type.price === 0 ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(type.price)} VNĐ`}</span>
                      </div>
                      <span className={styles.ticketRemaining}>{type.salesStatus === 'ON_SALE' && state.canBook ? `Còn ${type.remainingQuantity} vé` : state.salesLabel === 'Đã đóng bán' ? state.salesLabel : ticketSalesLabels[type.salesStatus]}</span>
                    </div>
                    {type.description && <p className={styles.ticketDesc}>{type.description}</p>}
                    {type.salesStatus === 'NOT_ON_SALE' && <p className={styles.ticketDesc}>Mở bán: {utcDate(type.saleStartTime).toLocaleString('vi-VN', { timeZone })}</p>}
                  </div>)}
                  {ticketTypes.length === 0 && <p className={styles.ticketDesc}>Chưa có thông tin loại vé.</p>}
                </div>

                {/* Main Purchase Action Button */}
                <button className={styles.buyButton} onClick={handleBookTicket} type="button" disabled={!state.canBook}>
                  <span>{state.actionLabel}</span>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                </button>

                {/* Security Badges & Guarantees */}
                <div className={styles.guarantees}>
                  <div className={styles.guaranteeItem}>
                    <span className="material-symbols-outlined text-[#006d3d] text-[16px]">verified</span>
                    <span>Cam kết <strong>vé chính hãng 100%</strong> từ {event.organizerName}</span>
                  </div>
                  <div className={styles.guaranteeItem}>
                    <span className="material-symbols-outlined text-[#006591] text-[16px]">lock</span>
                    <span>Bảo mật giao dịch đa cổng: <strong>VNPAY-QR, Visa/Mastercard</strong></span>
                  </div>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </section>

      {/* RECOMMENDATION */}
      {event.suggestedEvents && event.suggestedEvents.length > 0 && (
        <section className={styles.recommendationSection}>
          <div className={styles.recommendationContainer}>
            <div className={styles.recommendationHeader}>
              <div className={styles.recommendationTitleWrapper}>
                <span className={styles.titleAccent}></span>
                <h2 className={styles.recommendationTitle}>Có thể bạn cũng thích</h2>
              </div>
            </div>
            <div className={styles.recommendationGrid}>
              {event.suggestedEvents.map(suggestedEvent => (
                <EventCard key={suggestedEvent.id} event={suggestedEvent} />
              ))}
            </div>
          </div>
        </section>
      )}
      </main>
    </div>
  )
}
