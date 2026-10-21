import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Check, CircleAlert, Clock3, QrCode, RefreshCw } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { getBooking, verifyPaymentReturn } from '../api/booking-api'
import type { BookingDetail, PaymentReturn } from '../types/booking'
import { bookingCode, bookingError, formatMoney } from '../booking-display'
import { BookingShell, EventSummaryCard, LoadState, PaymentConfirmationNotice, TicketSafety } from '../components/BookingUi'
import styles from './BookingPages.module.css'

export function PaymentResultPage() {
  const location = useLocation()
  const { user } = useAuth()
  const [verified, setVerified] = useState<PaymentReturn | null>(null)
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let timer: number | undefined
    setLoading(true); setError(''); setBooking(null); setVerified(null)
    async function run() {
      try {
        const query = new URLSearchParams(location.search)
        if (!query.has('vnp_TxnRef') || !query.has('vnp_SecureHash')) { setError('Đường dẫn kết quả thanh toán không hợp lệ.'); setLoading(false); return }
        const result = await verifyPaymentReturn(query.toString(), controller.signal)
        if (controller.signal.aborted) return
        setVerified(result)
        if (user?.role !== 'CUSTOMER') { setLoading(false); return }
        const poll = async () => {
          try {
            const detail = await getBooking(result.bookingId, controller.signal)
            if (controller.signal.aborted) return
            setBooking(detail); setLoading(false)
            // The backend deadline determines expiry; a slow IPN must not lose the client after 60 seconds.
            if (detail.status === 'PAYMENT_CONFIRMING'
                || (detail.status === 'PENDING' && result.responseCode === '00' && result.transactionStatus === '00')) {
              timer = window.setTimeout(poll, 2000)
            }
          } catch (cause) { if (!controller.signal.aborted) { setError(bookingError(cause)); setLoading(false) } }
        }
        await poll()
      } catch (cause) { if (!controller.signal.aborted) { setError(bookingError(cause)); setLoading(false) } }
    }
    void run()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [location.search, user?.id, user?.role, version])
  const success = booking?.status === 'PAID'
  const review = booking?.status === 'PAYMENT_REVIEW'
  const confirming = booking?.status === 'PAYMENT_CONFIRMING'
  const failed = !confirming && verified && (verified.responseCode !== '00' || verified.transactionStatus !== '00')
  const expired = booking?.status === 'EXPIRED'
  const title = success ? 'Thanh toán thành công!' : review ? 'Thanh toán đang được đối soát' : failed ? 'Thanh toán chưa hoàn tất' : expired ? 'Booking đã hết hạn' : 'Đang xác nhận thanh toán…'
  return <BookingShell><LoadState error={error} loading={loading} retry={() => setVersion(value => value + 1)} />
    {!loading && !error && verified && <><section className={styles.successHero} aria-live="polite"><div className={styles.successIcon} style={!success ? { background: review || failed || expired ? '#bd8a32' : '#5c8d79' } : undefined}>{success ? <Check size={40} /> : failed || review || expired ? <CircleAlert size={38} /> : <Clock3 size={38} />}</div>
      <span className={`${styles.badge} ${styles.green}`}>{bookingCode(verified.bookingId)}</span><h1>{title}</h1>
      <p>{success ? 'Vé điện tử đã được phát hành. Hẹn gặp bạn tại sự kiện!' : review ? 'Giao dịch cần được kiểm tra trước khi phát vé. Vui lòng giữ mã booking để liên hệ ban tổ chức.' : failed ? 'Giao dịch đã bị hủy hoặc chưa thành công. Bạn có thể thử lại nếu thời gian giữ vé còn hiệu lực.' : expired ? 'Thời gian giữ vé đã kết thúc. Vui lòng xem lại booking trước khi đặt vé mới.' : 'EventHub đang kiểm tra xác nhận thanh toán. Vé sẽ xuất hiện sau khi giao dịch được ghi nhận.'}</p>
      {!user && <div className={styles.actions}><Link className={styles.primary} to="/login" state={{ from: location.pathname + location.search }}>Đăng nhập để xem booking và vé</Link></div>}
      {user?.role === 'CUSTOMER' && <div className={styles.actions}>{success && <Link className={styles.primary} to={`/customer/bookings/${verified.bookingId}/tickets`}><QrCode size={18} /> Xem vé điện tử / QR</Link>}{booking?.status === 'PENDING' && failed && <Link className={styles.primary} to={`/customer/bookings/${verified.bookingId}/checkout`}>Thử thanh toán lại</Link>}<Link className={styles.secondary} to={`/customer/bookings/${verified.bookingId}`}>Xem chi tiết booking</Link>{expired && <button className={styles.secondary} onClick={() => setVersion(value => value + 1)}><RefreshCw size={16} /> Kiểm tra lại</button>}</div>}
    </section>{booking && <div className={styles.centerCard}>{confirming && <PaymentConfirmationNotice deadline={booking.paymentConfirmationDeadline} />}<EventSummaryCard event={booking.event} /><section className={styles.card} style={{ marginTop: 20 }}><h2>Chi tiết vé đã chọn</h2>{booking.items.map(item => <div key={item.id} className={styles.row}><span>{item.quantity} × {item.ticketTypeName}</span><strong>{formatMoney(item.subtotal)}</strong></div>)}<div className={styles.total}><span>Tổng thanh toán</span><strong>{formatMoney(booking.totalAmount)}</strong></div></section><TicketSafety /></div>}</>}
  </BookingShell>
}
