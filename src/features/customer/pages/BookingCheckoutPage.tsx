import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowRight, Info, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { redirectToPayment, startPayment } from '../api/booking-api'
import { bookingCode, bookingError, formatMoney, validId } from '../booking-display'
import { useBooking, useHoldTime } from '../hooks/useBooking'
import { BackLink, BookingShell, EventSummaryCard, HoldNotice, LoadState, PageHeading, PaymentConfirmationNotice, StatusBadge } from '../components/BookingUi'
import styles from './BookingPages.module.css'

export function BookingCheckoutPage() {
  const { bookingId } = useParams()
  const { user } = useAuth()
  const { data: booking, error, loading, reload } = useBooking(validId(bookingId))
  const seconds = useHoldTime(booking?.expiredAt)
  const [accepted, setAccepted] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const sending = useRef(false)
  async function pay() {
    if (!booking || !accepted || !seconds || sending.current) return
    sending.current = true; setPaying(true); setPaymentError('')
    try { redirectToPayment((await startPayment(booking.id)).paymentUrl) }
    catch (cause) { setPaymentError(bookingError(cause)); reload(); sending.current = false; setPaying(false) }
  }
  return <BookingShell><PageHeading title="Xác nhận & thanh toán" subtitle="Kiểm tra thông tin đặt vé trước khi chuyển sang cổng VNPay Sandbox."><BackLink /></PageHeading>
    <LoadState error={error} loading={loading && !booking} retry={reload} />
    {!error && booking && <>{booking.status === 'PENDING' && <HoldNotice expiresAt={booking.expiredAt} />}
      {booking.status === 'PAYMENT_CONFIRMING' && <PaymentConfirmationNotice deadline={booking.paymentConfirmationDeadline} />}
      {booking.status !== 'PENDING' && booking.status !== 'PAYMENT_CONFIRMING' && <div className={styles.notice}><Info /><div><StatusBadge status={booking.status} /><p>Booking này không còn ở trạng thái chờ thanh toán. <Link to={`/customer/bookings/${booking.id}`}>Xem chi tiết booking</Link></p></div></div>}
      <div className={styles.checkoutColumns} style={{ marginTop: 22 }}><div className={styles.stack}>
        <section className={styles.card}><h2>01 · Thông tin người đặt vé</h2><div className={styles.fieldGrid}>
          <label className={styles.field}>Họ và tên<input readOnly value={user?.fullName || 'Chưa cập nhật'} /></label>
          <label className={styles.field}>Số điện thoại<input readOnly value={user?.phone || 'Chưa cập nhật'} /></label>
          <label className={`${styles.field} ${styles.fieldWide}`}>Email tài khoản<input readOnly value={user?.email || ''} /></label>
        </div><p className={styles.subtle} style={{ marginTop: 16 }}>Vé điện tử được lưu trong “Vé của tôi” sau khi thanh toán được xác nhận.</p></section>
        <section className={styles.card}><h2>02 · Phương thức thanh toán</h2><div className={styles.provider}><span className={styles.providerLogo}>VN<i>PAY</i></span><div><strong>Cổng thanh toán VNPay Sandbox</strong><p>Chọn ngân hàng hoặc phương thức thanh toán trên giao diện VNPay.</p></div></div>
          <div className={styles.notice}><Info size={20} /><span>Bạn sẽ được chuyển sang VNPay để hoàn tất giao dịch thử nghiệm, sau đó quay lại EventHub xem kết quả.</span></div></section>
        <section className={styles.card}><label className={styles.check}><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} /><span>Tôi đã kiểm tra sự kiện, loại vé, số lượng và tổng tiền thanh toán.</span></label><p className={styles.subtle} style={{ marginTop: 15 }}><ShieldCheck size={14} /> Mã QR chỉ được phát hành sau khi backend xác nhận thanh toán.</p></section>
      </div><aside className={styles.stack}><EventSummaryCard event={booking.event} /><section className={styles.card}>
        <div className={styles.row}><small>MÃ BOOKING</small><strong>{bookingCode(booking.id)}</strong></div>
        {booking.items.map(item => <div className={styles.row} key={item.id}><span>{item.quantity} × {item.ticketTypeName}</span><strong>{formatMoney(item.subtotal)}</strong></div>)}
        <div className={styles.total}><span>Tổng thanh toán</span><strong>{formatMoney(booking.totalAmount)}</strong></div>
        {paymentError && <p className={styles.error} role="alert">{paymentError}</p>}
        <button className={`${styles.primary} ${styles.full}`} disabled={!accepted || !seconds || booking.status !== 'PENDING' || paying} onClick={pay}>{paying ? 'Đang chuyển đến VNPay…' : 'Thanh toán qua VNPay'}<ArrowRight size={17} /></button>
        {booking.status === 'EXPIRED' && <Link className={`${styles.secondary} ${styles.full}`} style={{ marginTop: 12 }} to={`/customer/events/${booking.event.id}/book`}>Chọn vé lại</Link>}
      </section></aside></div></>}
  </BookingShell>
}
