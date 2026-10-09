import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { getPublicEventDetail } from '../api/event-api'
import type { PublicEventDetailResponse } from '../types/event'
import { EventCard } from '../components/EventCard'
import { CustomerHeader } from '../components/CustomerHeader'
import styles from './EventDetailPage.module.css'

export function EventDetailPage() {
  const { eventId } = useParams()
  const [event, setEvent] = useState<PublicEventDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return
      setLoading(true)
      try {
        const data = await getPublicEventDetail(Number(eventId))
        setEvent(data)
      } catch (error) {
        console.error('Lỗi khi tải chi tiết sự kiện:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
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
        <p>Không tìm thấy sự kiện.</p>
        <Link to="/" className={styles.buyButton} style={{ width: 'auto', padding: '0 24px' }}>Về trang chủ</Link>
      </div>
    )
  }

  const startDate = new Date(event.startTime)
  const endDate = new Date(event.endTime)

  const monthText = `Tháng ${startDate.getMonth() + 1}`
  const dayText = startDate.getDate().toString().padStart(2, '0')
  const yearText = startDate.getFullYear().toString()

  const formattedStartTime = startDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' • ' + startDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const formattedEndTime = endDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' • ' + endDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const formattedPrice = event.startingPrice 
    ? `Từ ${new Intl.NumberFormat('vi-VN').format(event.startingPrice)} VNĐ`
    : 'Miễn phí'

  const handleBookTicket = () => {
    alert('Tính năng đặt vé đang được phát triển!')
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
                    <span className={styles.pulseDot}></span> Đang mở bán
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
                  {event.description ? <p>{event.description}</p> : <p>Sự kiện hứa hẹn mang đến những trải nghiệm âm nhạc và nghệ thuật tuyệt vời nhất. Thông tin chi tiết đang được cập nhật thêm.</p>}
                </div>
                
                {/* Fast Specs Badges Bento Grid */}
                <div className={styles.bentoGrid}>
                  <div className={styles.bentoItem}>
                    <span className="material-symbols-outlined text-[24px] text-[#006d3d]">graphic_eq</span>
                    <span className={styles.bentoTitle}>Âm thanh chuẩn Arena</span>
                    <span className={styles.bentoDesc}>Hệ thống L-Acoustics & Visual 3D đỉnh cao</span>
                  </div>
                  <div className={styles.bentoItem}>
                    <span className="material-symbols-outlined text-[24px] text-[#006591]">card_giftcard</span>
                    <span className={styles.bentoTitle}>Quà tặng Check-in</span>
                    <span className={styles.bentoDesc}>Vòng tay LED đồng bộ + Lightstick VIP</span>
                  </div>
                  <div className={styles.bentoItem}>
                    <span className="material-symbols-outlined text-[24px] text-[#006c49]">verified_user</span>
                    <span className={styles.bentoTitle}>Quy chuẩn 16+</span>
                    <span className={styles.bentoDesc}>Không gian văn minh, kiểm soát an ninh tối đa</span>
                  </div>
                </div>

                {/* Line-up nghệ sĩ teaser */}
                {event.lineup && event.lineup.length > 0 && (
                  <div className={styles.lineupSection}>
                    <h3 className={styles.lineupHeader}>
                      <span className="material-symbols-outlined text-[#006d3d] text-[18px]">groups</span>
                      Dàn nghệ sĩ & Khách mời tham gia
                    </h3>
                    <div className={styles.lineupList}>
                      {event.lineup.map((artist, index) => (
                        <span key={index} className={styles.lineupItem}>{artist}</span>
                      ))}
                    </div>
                  </div>
                )}
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
                    <div className={styles.legendItem}>
                      <span className={styles.colorBoxVIP}></span>
                      <span>VIP Fanzone (1.200k)</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.colorBoxA}></span>
                      <span>Khán Đài A (650k)</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.colorBoxGA}></span>
                      <span>Early Bird GA (350k)</span>
                    </div>
                    <div className={styles.legendItemGray}>
                      <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                      <span>Cổng soát vé A & B</span>
                    </div>
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
                    <span className={styles.pulseDotAlt}></span> Đang mở bán
                  </span>
                </div>

                {/* TICKET CARDS LIST */}
                <div className={styles.ticketList}>
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketCardHeader}>
                      <div className={styles.ticketCardInfo}>
                        <div className={styles.ticketCardTitleWrapper}>
                          <span className={styles.ticketTagVIP}>VIP</span>
                          <h4 className={styles.ticketName}>VIP Fanzone</h4>
                        </div>
                        <span className={styles.ticketPrice}>{formattedPrice}</span>
                      </div>
                      <span className={styles.ticketRemaining}>Còn vé</span>
                    </div>
                    <p className={styles.ticketDesc}>Vị trí đẹp nhất, check-in ưu tiên riêng biệt, tặng kèm phần quà đặc biệt.</p>
                  </div>
                  
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketCardHeader}>
                      <div className={styles.ticketCardInfo}>
                        <div className={styles.ticketCardTitleWrapper}>
                          <span className={styles.ticketTagGA}>GA</span>
                          <h4 className={styles.ticketName}>Vé Tiêu Chuẩn</h4>
                        </div>
                        <span className={styles.ticketPrice}>Theo hạng vé</span>
                      </div>
                      <span className={styles.ticketRemaining}>Còn vé</span>
                    </div>
                    <p className={styles.ticketDesc}>Khu vực vé đứng/ngồi phổ thông, tầm nhìn toàn cảnh sân khấu.</p>
                  </div>
                </div>

                {/* Main Purchase Action Button */}
                <button className={styles.buyButton} onClick={handleBookTicket} type="button">
                  <span>Đặt vé ngay</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
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

              {/* Hotline support card */}
              <div className={styles.supportBox}>
                <div className={styles.supportBoxInner}>
                  <span className="material-symbols-outlined text-[#006d3d] text-[24px]">headset_mic</span>
                  <div className={styles.supportText}>
                    <span className={styles.supportTitle}>Hỗ trợ đặt vé sự kiện</span>
                    <span className={styles.supportDesc}>Hotline 1900 6408 (Nhánh 1)</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#6d7b6f]">chevron_right</span>
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
