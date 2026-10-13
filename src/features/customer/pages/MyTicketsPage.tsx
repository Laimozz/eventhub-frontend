import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { CalendarDays, CheckCircle2, Expand, MapPin, QrCode, Ticket, User, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { getTickets } from '../api/booking-api'
import type { ElectronicTicket, PageResponse } from '../types/booking'
import { bookingError, formatBookingDate, validId } from '../booking-display'
import { BookingShell, LoadState, PageHeading, Pagination, TicketSafety } from '../components/BookingUi'
import styles from './BookingPages.module.css'

export function MyTicketsPage() {
  const { bookingId } = useParams()
  const [params, setParams] = useSearchParams()
  const requestedPage = Number(params.get('page'))
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0
  const status = ['VALID', 'USED'].includes(params.get('status') || '') ? params.get('status')! : ''
  const [data, setData] = useState<PageResponse<ElectronicTicket> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const controller = new AbortController()
    let inFlight = false
    setLoading(true); setError(''); setSelectedId(null)
    async function fetchTickets() {
      if (inFlight) return
      inFlight = true
      try {
        if (bookingId && !validId(bookingId)) throw new Error('Mã booking không hợp lệ.')
        const result = await getTickets(page, status || undefined, bookingId ? Number(bookingId) : undefined, controller.signal)
        if (!controller.signal.aborted) { setData(result); setError('') }
      } catch (cause) { if (!controller.signal.aborted) setError(bookingError(cause)) }
      finally { inFlight = false; if (!controller.signal.aborted) setLoading(false) }
    }
    void fetchTickets()
    const timer = window.setInterval(() => void fetchTickets(), 10_000)
    const onFocus = () => void fetchTickets()
    window.addEventListener('focus', onFocus)
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [page, status, bookingId, version])
  const selected = !error && data?.items.find(ticket => ticket.id === selectedId && ticket.canCheckIn && ticket.qrToken)
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal()
    if (!selected && dialog.current?.open) dialog.current.close()
  }, [selected])
  function changePage(next: number, filter = status) {
    setParams({ ...(filter ? { status: filter } : {}), ...(next ? { page: String(next) } : {}) })
  }
  return <BookingShell>
    <PageHeading title="Vé điện tử của tôi" subtitle="Quản lý vé tham dự và xuất trình mã QR tại cổng soát vé." />
    <div className={styles.tabs} role="group" aria-label="Lọc vé">{[['', 'Tất cả vé'], ['VALID', 'Vé chưa sử dụng'], ['USED', 'Đã check-in']].map(([value, label]) => <button key={value} className={status === value ? styles.selected : ''} aria-pressed={status === value} onClick={() => changePage(0, value)}>{label}</button>)}</div>
    <LoadState loading={loading} error={error} retry={() => setVersion(value => value + 1)} />
    {!loading && !error && data && <><div className={styles.list}>{data.items.map(ticket => <article className={`${styles.ticketCard} ${ticket.status === 'USED' ? styles.used : ''}`} key={ticket.id}>
      <div className={styles.ticketPoster}>{ticket.event.thumbnailImageUrl && <img src={ticket.event.thumbnailImageUrl} alt="" />}<span className={`${styles.badge} ${ticket.canCheckIn ? styles.green : styles.muted}`}>{ticket.status === 'USED' ? 'ĐÃ CHECK-IN' : ticket.canCheckIn ? 'SẴN SÀNG CHECK-IN' : 'KHÔNG THỂ CHECK-IN'}</span><h2>{ticket.event.name}</h2></div>
      <div className={styles.ticketContent}><div><small>MÃ VÉ ĐIỆN TỬ</small><h3>{ticket.ticketCode}</h3></div><div className={styles.ticketZone}><small>LOẠI VÉ</small><p><strong>{ticket.ticketTypeName}</strong></p></div><p><CalendarDays />{formatBookingDate(ticket.event.startTime)}</p><p><MapPin />{ticket.event.address}, {ticket.event.city}</p><p><User />{ticket.ownerName || 'Khách tham dự'}</p><Link to={`/customer/bookings/${ticket.bookingId}`} className={styles.secondary}>Chi tiết booking</Link></div>
      <div className={styles.ticketQr}>{ticket.canCheckIn && ticket.qrToken ? <><small>QUÉT MÃ ĐỂ VÀO CỔNG</small><div className={styles.qr}><QRCodeSVG value={ticket.qrToken} size={180} level="M" marginSize={4} title={`QR vé ${ticket.ticketCode}`} /></div><button className={styles.secondary} onClick={() => setSelectedId(ticket.id)}><Expand size={15} /> Phóng to mã QR</button><small>Giữ riêng mã QR của bạn</small></> : <>{ticket.status === 'USED' ? <CheckCircle2 size={44} /> : <QrCode size={44} />}<strong>{ticket.status === 'USED' ? 'Vé đã được sử dụng' : 'Vé không còn hiệu lực vào cửa'}</strong>{ticket.checkedInAt && <p className={styles.subtle}>{formatBookingDate(ticket.checkedInAt)}</p>}</>}</div>
    </article>)}</div>{data.items.length === 0 && <div className={styles.empty}><Ticket size={40} /><h2>Chưa có vé trong mục này</h2><p>Vé điện tử xuất hiện sau khi booking được xác nhận thanh toán.</p><Link to="/customer/explore" className={styles.primary}>Khám phá sự kiện</Link></div>}<Pagination page={page} totalPages={data.totalPages} onChange={changePage} /></>}
    <TicketSafety />
    <dialog ref={dialog} className={styles.dialog} onClose={() => setSelectedId(null)} aria-labelledby="qr-title">{selected && <><h2 id="qr-title">QR vé điện tử</h2><strong>{selected.ticketTypeName}</strong><div className={styles.qr}><QRCodeSVG value={selected.qrToken!} size={300} level="M" marginSize={4} title={`QR phóng to ${selected.ticketCode}`} /></div><p>{selected.ticketCode}</p><p>Xuất trình mã QR của bạn tại cổng soát vé. Không chia sẻ mã này.</p><button className={styles.secondary} onClick={() => dialog.current?.close()}><X size={17} /> Đóng mã QR</button></>}</dialog>
  </BookingShell>
}
