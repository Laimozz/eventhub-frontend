import { Link } from 'react-router'
import type { PublicEventSummaryResponse } from '../types/event'
import styles from './EventCard.module.css'

interface EventCardProps {
  event: PublicEventSummaryResponse
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startTime)
  const day = startDate.getDate().toString().padStart(2, '0')
  const month = `Th${startDate.getMonth() + 1}`
  const dayOfWeek = startDate.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('Th ', 'T')
  const dateBadgeText = `${month} - ${dayOfWeek}`
  
  const formattedTime = startDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const formattedFullDate = startDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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
          
          {/* Urgency Tag (Optional - hardcoded demo state) */}
          <div className={styles.urgencyBadge}>
            <span className={styles.pulseDot}></span>
            <span>Đang mở bán</span>
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
        <Link to={`/customer/events/${event.id}`} className={styles.actionBtn}>
          <span>Mua vé</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </article>
  )
}
