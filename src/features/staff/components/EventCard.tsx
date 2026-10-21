import { Link } from 'react-router'
import type { StaffAssignedEventDto } from '../types/staff'
import { isEventToday, isEventTomorrow } from '../hooks/useStaffEvents'
import styles from './EventCard.module.css'

interface EventCardProps {
  event: StaffAssignedEventDto
}

function formatEventDate(isoString: string): { label: string; isToday: boolean; isTomorrow: boolean } {
  if (!isoString) return { label: '', isToday: false, isTomorrow: false }
  try {
    const d = new Date(isoString)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    const today = isEventToday(isoString)
    const tomorrow = isEventTomorrow(isoString)

    if (today) {
      return { label: `HÔM NAY • ${hours}:${minutes}`, isToday: true, isTomorrow: false }
    }
    if (tomorrow) {
      return { label: `NGÀY MAI • ${hours}:${minutes}`, isToday: false, isTomorrow: true }
    }
    return { label: `${hours}:${minutes} • ${day}/${month}/${year}`, isToday: false, isTomorrow: false }
  } catch {
    return { label: isoString, isToday: false, isTomorrow: false }
  }
}

export function EventCard({ event }: EventCardProps) {
  const dateInfo = formatEventDate(event.startTime)
  const hasTickets = event.totalTickets > 0
  const progressPercent = hasTickets
    ? Math.min(100, Math.round((event.checkedInTickets / event.totalTickets) * 100))
    : 0

  return (
    <article className={styles.card}>
      <div className={styles.posterWrapper}>
        <img
          src={
            event.thumbnailImageUrl ||
            event.bannerImageUrl ||
            'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=600&q=80'
          }
          alt={event.eventName}
          className={styles.posterImg}
          loading="lazy"
        />
        <div className={styles.posterOverlay} />

        <div
          className={`${styles.dateBadge} ${
            dateInfo.isToday ? styles.dateBadgeToday : dateInfo.isTomorrow ? styles.dateBadgeTomorrow : ''
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {dateInfo.isToday ? 'local_fire_department' : dateInfo.isTomorrow ? 'bolt' : 'calendar_today'}
          </span>
          <span>{dateInfo.label}</span>
        </div>

        <div className={styles.assignmentBadge}>
          <span className={styles.activeDot} />
          <span>{event.staffStatus === 'ACTIVE' ? 'Đang phân công' : 'Tạm ngưng'}</span>
        </div>

        <div className={styles.venueBanner}>
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span>
            {event.venueAddress ? `${event.venueAddress}, ` : ''}
            {event.venueCity || 'Địa điểm chưa cập nhật'}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.eventTitle} title={event.eventName}>
          {event.eventName}
        </h3>

        {event.description && <p className={styles.eventDesc}>{event.description}</p>}

        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <div className={styles.progressLabel}>
              <span className="material-symbols-outlined text-[15px] text-primary">how_to_reg</span>
              <span>Tiến độ soát vé</span>
            </div>
            <span className={styles.progressPercent}>{progressPercent}%</span>
          </div>

          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
          </div>

          <div className={styles.progressStats}>
            <span>
              Đã check-in: <strong>{event.checkedInTickets.toLocaleString('vi-VN')}</strong>
            </span>
            <span>
              Tổng vé bán: <strong>{event.totalTickets.toLocaleString('vi-VN')}</strong>
            </span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.organizerInfo}>
            <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
            <span>
              BTC: <strong className={styles.organizerName}>{event.organizerName || 'Ban tổ chức'}</strong>
            </span>
          </div>

          <div className={styles.shiftBadge}>
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            <span>Ca trực hợp lệ</span>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Link to={`/staff/events/${event.eventId}`} className={styles.btnDetail}>
            <span>Chi tiết & Soát vé</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
