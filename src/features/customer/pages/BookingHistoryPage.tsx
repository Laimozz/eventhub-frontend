import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CalendarDays, MapPin, QrCode, Ticket } from 'lucide-react'
import { getBookings } from '../api/booking-api'
import type { BookingSummary, PageResponse } from '../types/booking'
import { bookingCode, bookingError, formatBookingDate, formatMoney } from '../booking-display'
import { BookingShell, LoadState, PageHeading, Pagination, StatusBadge } from '../components/BookingUi'
import styles from './BookingPages.module.css'

export function BookingHistoryPage() {
  const [params, setParams] = useSearchParams()
  const page = /^\d+$/.test(params.get('page') || '') ? Number(params.get('page')) : 0
  const [data, setData] = useState<PageResponse<BookingSummary> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    getBookings(page, controller.signal).then(setData).catch(cause => { if (!controller.signal.aborted) setError(bookingError(cause)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, version])
  return <BookingShell><PageHeading title="Lịch sử đặt vé & Booking của tôi" subtitle="Theo dõi đơn đặt vé, tiếp tục thanh toán và mở vé điện tử của bạn."><Link className={styles.primary} to="/customer/ve-cua-toi"><QrCode size={17} /> Vé của tôi</Link></PageHeading>
    <LoadState error={error} loading={loading} retry={() => setVersion(value => value + 1)} />
    {!error && !loading && data && <><p className={styles.subtle} style={{ marginBottom: 20 }}>{data.totalElements} booking · Sắp xếp từ mới nhất</p>
      {!data.items.length && <div className={styles.empty}><Ticket size={40} /><h2>Bạn chưa có booking nào</h2><p>Khám phá sự kiện và chọn trải nghiệm tiếp theo của bạn.</p><Link className={styles.primary} to="/customer/explore">Khám phá sự kiện</Link></div>}
      <div className={styles.list}>{data.items.map(booking => <article className={styles.bookingCard} key={booking.id}>
        <div className={styles.bookingBar}><span>MÃ BOOKING <strong>{bookingCode(booking.id)}</strong></span><div className={styles.actions}><span>Ngày đặt: {formatBookingDate(booking.createdAt)}</span><StatusBadge status={booking.status} /></div></div>
        <div className={styles.bookingBody}>{booking.event.thumbnailImageUrl ? <img src={booking.event.thumbnailImageUrl} alt={booking.event.name} /> : <Ticket size={60} />}
          <div><h2>{booking.event.name}</h2><div className={styles.bookingMeta}><span><CalendarDays />{formatBookingDate(booking.event.startTime)}</span><span><MapPin />{booking.event.address}, {booking.event.city}</span>{booking.status === 'PENDING' && <span>Giữ vé đến {formatBookingDate(booking.expiredAt)}</span>}</div></div>
          <div className={styles.bookingActions}><small>Tổng tiền booking</small><strong>{formatMoney(booking.totalAmount)}</strong>
            {booking.status === 'PAID' && <Link className={styles.primary} to={`/customer/bookings/${booking.id}/tickets`}><QrCode size={16} /> Xem vé QR</Link>}
            {booking.status === 'PENDING' && <Link className={styles.primary} to={`/customer/bookings/${booking.id}/checkout`}>Tiếp tục thanh toán</Link>}
            <Link className={styles.secondary} to={`/customer/bookings/${booking.id}`}>Xem chi tiết booking</Link>
          </div></div></article>)}</div>
      <Pagination page={page} totalPages={data.totalPages} onChange={next => setParams({ page: String(next) })} /></>}
  </BookingShell>
}
