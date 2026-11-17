import type { BookingPayment } from '../types/booking'
import { formatBookingDate, formatMoney } from '../booking-display'
import styles from '../pages/BookingPages.module.css'

const labels: Record<string, string> = {
  WAITING: 'Chờ hoàn tiền', QUEUED: 'Đã xếp hàng hoàn tiền', PROCESSING: 'Đang xử lý hoàn tiền',
  RECONCILIATION: 'Đang xác minh kết quả hoàn tiền', COMPLETED: 'Đã hoàn tiền', FAILED: 'Hoàn tiền bị từ chối',
}

export function RefundStatus({ refund }: { refund: BookingPayment['refund'] }) {
  if (!refund) return null
  return <section aria-label="Trạng thái hoàn tiền" className={styles.card} style={{ marginTop: 16 }}>
    <h3>{labels[refund.status] ?? refund.status}</h3>
    <p>{formatMoney(refund.amount)} · Hoàn toàn bộ giao dịch</p>
    {['QUEUED', 'PROCESSING'].includes(refund.status) && <p>Khoản hoàn đang được xử lý.</p>}
    {refund.status === 'RECONCILIATION' && <p>Admin đang kiểm tra giao dịch này.</p>}
    {refund.status === 'WAITING' && <p>Khoản hoàn đang chờ Admin xử lý. Bạn không cần gửi yêu cầu hoặc cung cấp tài khoản ngân hàng.</p>}
    {refund.status === 'FAILED' && <p>Admin cần kiểm tra giao dịch này. Vui lòng cung cấp mã booking khi liên hệ hỗ trợ.</p>}
    {refund.status === 'COMPLETED' && <p>Giao dịch đã được hoàn tiền.</p>}
    {refund.reference && <div className={styles.row}><span>Mã hoàn tiền</span><strong>{refund.reference}</strong></div>}
    {refund.refundedAt && <div className={styles.row}><span>Thời gian hoàn</span><strong>{formatBookingDate(refund.refundedAt)}</strong></div>}
  </section>
}
