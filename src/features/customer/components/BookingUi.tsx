import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, Ticket } from 'lucide-react'
import { CustomerHeader } from './CustomerHeader'
import { CustomerFooter } from './CustomerFooter'
import type { BookingEvent, BookingStatus } from '../types/booking'
import { formatBookingDate } from '../booking-display'
import { useHoldTime } from '../hooks/useBooking'
import styles from '../pages/BookingPages.module.css'

export function BookingShell({ children }: { children: ReactNode }) {
  return <div className={styles.page}><CustomerHeader /><main className={styles.main}>
    <nav className={styles.breadcrumb} aria-label="Điều hướng"><Link to="/customer/explore">Khám phá sự kiện</Link><span>/</span><Link to="/customer/booking-cua-toi">Booking của tôi</Link><span>/</span><Link to="/customer/ve-cua-toi">Vé điện tử</Link></nav>
    {children}</main><CustomerFooter /></div>
}
export function StatusBadge({ status }: { status: BookingStatus }) {
  const names = { PENDING: 'Chờ thanh toán', PAYMENT_CONFIRMING: 'Đang xác nhận thanh toán', PAID: 'Đã thanh toán', EXPIRED: 'Hết hạn', PAYMENT_REVIEW: 'Đang đối soát' }
  return <span className={`${styles.badge} ${status === 'PAID' ? styles.green : status === 'PENDING' || status === 'PAYMENT_CONFIRMING' ? styles.amber : styles.muted}`}>{names[status] || status}</span>
}
export function PageHeading({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return <div className={styles.heading}><div><span className={styles.eyebrow}>EVENTHUB · TRẢI NGHIỆM CỦA BẠN</span><h1>{title}</h1><p>{subtitle}</p></div>{children}</div>
}
export function LoadState({ error, loading, retry }: { error: string; loading: boolean; retry: () => void }) {
  if (error) return <div className={styles.empty} role="alert"><Ticket size={36} /><h2>Chưa thể tải thông tin</h2><p>{error}</p><button className={styles.secondary} onClick={retry}>Thử lại</button></div>
  if (loading) return <div className={styles.empty} role="status"><span className={styles.spinner} /><p>Đang tải thông tin…</p></div>
  return null
}
export function EventSummaryCard({ event }: { event: Pick<BookingEvent, 'name' | 'thumbnailImageUrl' | 'startTime' | 'city' | 'address'> }) {
  return <article className={styles.eventCard}>
    <div className={styles.poster}>{event.thumbnailImageUrl ? <img src={event.thumbnailImageUrl} alt={event.name} /> : <Ticket size={54} />}<div className={styles.posterTitle}><span>SỰ KIỆN TRỰC TIẾP</span><h2>{event.name}</h2></div></div>
    <div className={styles.eventMeta}><div><CalendarDays /><p><small>Thời gian diễn ra</small><strong>{formatBookingDate(event.startTime)}</strong></p></div><div><MapPin /><p><small>Địa điểm tổ chức</small><strong>{event.city}</strong><span>{event.address}</span></p></div></div>
  </article>
}
export function HoldNotice({ expiresAt }: { expiresAt: string }) {
  const seconds = useHoldTime(expiresAt)
  return <div className={`${styles.holdNotice} ${seconds === 0 ? styles.warning : ''}`} role="status"><CalendarDays size={28} /><div><strong>{seconds ? 'Vé của bạn đang được giữ trong' : 'Đã hết thời gian thanh toán'} <span className={styles.timer}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span></strong><p>{seconds ? 'Hoàn tất thanh toán trước khi thời gian kết thúc. Tải lại trang không làm gia hạn giữ vé.' : 'Đang kiểm tra trạng thái booking. Nếu đã thanh toán, vui lòng chờ xác nhận trước khi đặt lại vé.'}</p></div></div>
}
export function PaymentConfirmationNotice({ deadline }: { deadline: string | null }) {
  const seconds = useHoldTime(deadline || undefined)
  return <div className={styles.holdNotice} role="status"><CalendarDays size={28} /><div><strong>Đang xác nhận thanh toán {deadline && <span className={styles.timer}>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>}</strong><p>Đã hết hạn thanh toán. Vé đang được giữ để chờ kết quả giao dịch đã bắt đầu. Vui lòng chờ, không cần thanh toán hoặc đặt vé lại.</p></div></div>
}
export function TicketSafety() {
  return <aside className={styles.safety}><ShieldCheck size={25} /><div><h3>Vé điện tử của bạn</h3><p>Xuất trình QR tại cổng soát vé. Giữ riêng mã QR của bạn. Vé đã sử dụng sẽ không hiển thị mã QR.</p></div></aside>
}
export function BackLink() { return <Link className={styles.secondary} to="/customer/booking-cua-toi"><ArrowLeft size={17} /> Lịch sử booking</Link> }
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return totalPages > 1 ? <nav className={styles.pagination} aria-label="Phân trang"><button className={styles.secondary} disabled={page <= 0} onClick={() => onChange(page - 1)}>Trang trước</button><span>Trang {page + 1} / {totalPages}</span><button className={styles.secondary} disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Trang sau</button></nav> : null
}
