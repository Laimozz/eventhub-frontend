import { Link, useParams, useSearchParams } from 'react-router'
import { Check, Info, Printer, QrCode } from 'lucide-react'
import { bookingCode, formatBookingDate, formatMoney, validId } from '../booking-display'
import { useBooking } from '../hooks/useBooking'
import { BackLink, BookingShell, EventSummaryCard, HoldNotice, LoadState, PageHeading, PaymentConfirmationNotice, StatusBadge, TicketSafety } from '../components/BookingUi'
import styles from './BookingPages.module.css'

export function BookingDetailPage() {
  const { bookingId } = useParams()
  const [params] = useSearchParams()
  const { data: booking, error, loading, reload } = useBooking(validId(bookingId))
  return <BookingShell><LoadState error={error} loading={loading && !booking} retry={reload} />
    {!error && booking && <>{params.get('success') === '1' && booking.status === 'PAID' && booking.totalAmount === 0 && <div className={styles.successHero}><div className={styles.successIcon}><Check size={40} /></div><h1>Đặt vé thành công!</h1><p>Vé miễn phí của bạn đã được phát hành. Bạn có thể mở QR ngay bên dưới.</p></div>}
      <PageHeading title={`Chi tiết booking ${bookingCode(booking.id)}`} subtitle={`Ngày đặt: ${formatBookingDate(booking.createdAt)}`}><div className={styles.actions}><BackLink /><button className={styles.secondary} onClick={() => window.print()}><Printer size={17} /> In thông tin</button></div></PageHeading>
      <div className={styles.actions} style={{ marginBottom: 24 }}><StatusBadge status={booking.status} />{booking.status === 'PAID' && <Link className={styles.primary} to={`/customer/bookings/${booking.id}/tickets`}><QrCode size={18} /> Xem vé điện tử / QR</Link>}{booking.status === 'PENDING' && <Link className={styles.primary} to={`/customer/bookings/${booking.id}/checkout`}>Tiếp tục thanh toán</Link>}</div>
      {booking.status === 'PENDING' && <HoldNotice expiresAt={booking.expiredAt} />}
      {booking.status === 'PAYMENT_CONFIRMING' && <PaymentConfirmationNotice deadline={booking.paymentConfirmationDeadline} />}
      {booking.status === 'PAYMENT_REVIEW' && <p className={styles.notice}><Info size={21} /> Giao dịch đang được đối soát. Vé chưa được phát hành; vui lòng cung cấp mã booking khi liên hệ ban tổ chức.</p>}
      <div className={styles.checkoutColumns} style={{ marginTop: 22 }}><div className={styles.stack}><EventSummaryCard event={booking.event} />
        <section className={styles.card}><h2>Chi tiết danh sách vé ({booking.items.reduce((sum, item) => sum + item.quantity, 0)} vé)</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>LOẠI VÉ</th><th>SỐ LƯỢNG</th><th>ĐƠN GIÁ</th><th>THÀNH TIỀN</th></tr></thead><tbody>{booking.items.map(item => <tr key={item.id}><td><strong>{item.ticketTypeName}</strong>{item.tickets.map(ticket => <small key={ticket.id}>{ticket.ticketCode}{ticket.status === 'USED' ? ' · Đã check-in' : ''}</small>)}</td><td>{item.quantity}</td><td>{formatMoney(item.unitPrice)}</td><td><strong>{formatMoney(item.subtotal)}</strong></td></tr>)}</tbody></table></div><div className={styles.total}><span>Tổng thanh toán</span><strong>{formatMoney(booking.totalAmount)}</strong></div></section>
        <section className={styles.card}><h2>Thông tin thanh toán</h2>{!booking.payments.length && <p className={styles.subtle}>Chưa có giao dịch thanh toán.</p>}{booking.payments.map(payment => <div key={payment.id} style={{ borderBottom: '1px solid #edf2ee', paddingBottom: 16, marginBottom: 16 }}><div className={styles.row}><span>Phương thức</span><strong>{payment.paymentMethod === 'FREE' ? 'Vé miễn phí' : 'VNPay Sandbox'}</strong></div><div className={styles.row}><span>Trạng thái</span><strong>{payment.status === 'SUCCESS' ? 'Thành công' : payment.status === 'FAILED' ? 'Thất bại / Đã hủy' : payment.status === 'EXPIRED' ? 'Hết hạn' : 'Chờ xác nhận'}</strong></div><div className={styles.row}><span>Số tiền</span><strong>{formatMoney(payment.amount)}</strong></div>{payment.gatewayTransactionId && <div className={styles.row}><span>Mã giao dịch VNPay</span><strong>{payment.gatewayTransactionId}</strong></div>}{payment.paidAt && <div className={styles.row}><span>Thời gian thanh toán</span><strong>{formatBookingDate(payment.paidAt)}</strong></div>}</div>)}</section>
      </div><aside><TicketSafety /><div className={styles.card} style={{ marginTop: 22 }}><h3>Thông tin đơn hàng</h3><p className={styles.subtle}>Giá vé được lưu tại thời điểm đặt. Mỗi mã QR tương ứng một vé điện tử của bạn.</p><Link className={`${styles.secondary} ${styles.full}`} style={{ marginTop: 16 }} to={`/customer/events/${booking.event.id}`}>Xem sự kiện</Link></div></aside></div></>}
  </BookingShell>
}
