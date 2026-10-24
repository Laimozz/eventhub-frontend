import { Link } from 'react-router'
import type { PublicEventSummaryResponse } from '../types/event'
import { utcDate } from '../booking-display'
import { customerEventState } from '../event-sales'
// import { useAuth } from '../../auth/hooks/useAuth'
// import { recordEventInteraction } from '../api/event-api'
import styles from './EventCard.module.css'

interface EventCardProps {
  event: PublicEventSummaryResponse
}

export function EventCard({ event }: EventCardProps) {
  // const { user } = useAuth()

  const handleCardClick = () => {
    // Tạm thời comment vì hệ thống AI đang bảo trì sửa chữa
    /*
    recordEventInteraction({
      userId: user?.id,
      eventId: event.id,
      actionType: 'CLICK',
      recLogId: event.recLogId
    })
    */
  }

  const state = customerEventState(event)
  const startDate = utcDate(event.startTime)
  const timeZone = 'Asia/Ho_Chi_Minh'
  const day = startDate.toLocaleDateString('vi-VN', { day: '2-digit', timeZone })
  const month = `Th${startDate.toLocaleDateString('vi-VN', { month: 'numeric', timeZone })}`
  const dayOfWeek = startDate.toLocaleDateString('vi-VN', { weekday: 'short', timeZone }).replace('Th ', 'T')
  const dateBadgeText = `${month} - ${dayOfWeek}`
  
  const formattedTime = startDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })
  
  const formattedFullDate = startDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  })

  // Format to e.g. "19:00 - Thứ 7, 12/04/2025"
  const timeString = `${formattedTime} - ${formattedFullDate}`

  const formattedPrice = event.startingPrice 
    ? `Từ ${new Intl.NumberFormat('vi-VN').format(event.startingPrice)} VNĐ`
    : 'Miễn phí'
    
  const defaultImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhSXTRRyZK0qU08BcTHIs1ZcZysBHO7DmoQnucdkQ4W_XrY9lv-dc5zheHQM5AIJeEBlY6Qz1nsCDWGc_QvT5QbiTYJ5yYYLtAKoLhGGXsvYglN6ysEFtwPij9SRSGZEyj6hsy4dcWsoHN38q11kXYGBuoMQje_YQJWxSVXJW63xMQtSSCpM08a50QAL3TbdslblqhFk76F6IrmWAwxVa07rDJ6kBWWBH9g6xLt60R603Le4Hjo36p'

  return (
    <article className={styles.card}>
      <div className={styles.cardInner}>
        {/* Poster Image */}
        <div className={styles.imageWrapper}>
          <img 
            src={event.thumbnailImageUrl || defaultImage} 
            alt={event.name}
            className={styles.image}
            loading="lazy"
          />
          <div className={styles.imageGradient}></div>
          
          {/* Date Badge */}
          <div className={styles.dateBadge}>
            <span className={styles.day}>{day}</span>
            <span className={styles.month}>{dateBadgeText}</span>
          </div>
          
          {/* Category Tag */}
          <span className={styles.categoryBadge}>
            {event.categoryName || 'Sự kiện'}
          </span>
          
          {/* AI Match Badge if available */}
          {event.similarityScore != null && (
            <span style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '999px',
              boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
              zIndex: 3
            }}>
              AI {Math.min(98, Math.max(50, Math.round(event.similarityScore * 100)))}%
            </span>
          )}

          <div className={styles.urgencyBadge}>
            {state.canBook && <span className={styles.pulseDot}></span>}
            <span>{state.badgeLabel}</span>
          </div>
        </div>
        
        {/* Event Meta Details */}
        <div className={styles.content}>
          <h2 className={styles.title} title={event.name}>
            {event.name}
          </h2>
          <div className={styles.infoGroup}>
            <div className={styles.infoRow}>
              <span className={`material-symbols-outlined ${styles.icon}`}>schedule</span>
              <span>{timeString}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={`material-symbols-outlined ${styles.icon}`}>stadium</span>
              <span className={styles.truncate}>{event.city || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Pricing */}
      <div className={styles.footer}>
        <div className={styles.priceGroup}>
          <span className={styles.priceLabel}>Giá vé từ</span>
          <span className={styles.priceValue}>{formattedPrice}</span>
        </div>
        <Link to={`/customer/events/${event.id}`} onClick={handleCardClick} className={styles.actionBtn}>
          <span>{state.canBook ? 'Mua vé' : 'Xem chi tiết'}</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </article>
  )
}
