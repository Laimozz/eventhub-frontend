import type { StaffTicketStatsDto } from '../types/staff'
import styles from './TicketStatsCard.module.css'

interface TicketStatsCardProps {
  stats: StaffTicketStatsDto | null
  loading?: boolean
}

export function TicketStatsCard({ stats, loading = false }: TicketStatsCardProps) {
  if (loading || !stats) {
    return (
      <div className={styles.container}>
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className={styles.skeletonCard} />
        ))}
      </div>
    )
  }

  const { totalTickets, checkedInTickets, remainingTickets, checkInRate } = stats

  return (
    <div className={styles.container}>
      {/* 1. Tổng vé phát hành */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiTitle}>Tổng vé phát hành</span>
          <div className={`${styles.kpiIconWrap} ${styles.iconTotal}`}>
            <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
          </div>
        </div>
        <div>
          <div className={styles.kpiValueArea}>
            <span className={styles.kpiNumber}>{totalTickets.toLocaleString()}</span>
            <span className={styles.kpiSub}>vé</span>
          </div>
          <div className={styles.kpiSub}>Toàn bộ đơn đặt vé thành công</div>
        </div>
      </div>

      {/* 2. Đã check-in thành công */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiTitle}>Đã check-in thành công</span>
          <div className={`${styles.kpiIconWrap} ${styles.iconSuccess}`}>
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          </div>
        </div>
        <div>
          <div className={styles.kpiValueArea}>
            <span className={`${styles.kpiNumber} ${styles.numberSuccess}`}>
              {checkedInTickets.toLocaleString()}
            </span>
            <span className={styles.kpiSub}>({checkInRate}%)</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.min(100, Math.max(0, checkInRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Chưa check-in */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiTitle}>Chưa check-in</span>
          <div className={`${styles.kpiIconWrap} ${styles.iconPending}`}>
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
        </div>
        <div>
          <div className={styles.kpiValueArea}>
            <span className={`${styles.kpiNumber} ${styles.numberPending}`}>
              {remainingTickets.toLocaleString()}
            </span>
            <span className={styles.kpiSub}>vé</span>
          </div>
          <div className={styles.kpiSub}>Khán giả chưa qua cổng soát vé</div>
        </div>
      </div>

      {/* 4. Tiến độ hoàn thành */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiTitle}>Tỷ lệ vào cổng</span>
          <div className={`${styles.kpiIconWrap} ${styles.iconRate}`}>
            <span className="material-symbols-outlined text-[20px]">donut_large</span>
          </div>
        </div>
        <div>
          <div className={styles.kpiValueArea}>
            <span className={styles.kpiNumber}>{checkInRate}%</span>
          </div>
          <div className={styles.kpiSub}>
            {checkedInTickets >= totalTickets && totalTickets > 0
              ? 'Đã vào đủ 100% khán giả'
              : 'Đang tiếp tục đón khách'}
          </div>
        </div>
      </div>
    </div>
  )
}
