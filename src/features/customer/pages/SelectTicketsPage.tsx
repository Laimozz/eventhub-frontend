import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowRight, ShieldCheck, Ticket } from 'lucide-react'
import { createBooking, getTicketTypes } from '../api/booking-api'
import { getPublicEventDetail } from '../api/event-api'
import type { PublicEventDetailResponse } from '../types/event'
import type { TicketType } from '../types/booking'
import { bookingError, formatMoney, validId } from '../booking-display'
import { BookingShell, EventSummaryCard, LoadState, PageHeading, TicketSafety } from '../components/BookingUi'
import styles from './BookingPages.module.css'

export function SelectTicketsPage() {
  const { eventId } = useParams()
  const id = validId(eventId)
  const navigate = useNavigate()
  const [event, setEvent] = useState<PublicEventDetailResponse | null>(null)
  const [types, setTypes] = useState<TicketType[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [pending, setPending] = useState(false)
  const sending = useRef(false)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion(value => value + 1), [])
  useEffect(() => {
    let active = true
    if (!id) { setError('Mã sự kiện không hợp lệ.'); setLoading(false); return }
    setLoading(true); setError('')
    Promise.all([getPublicEventDetail(id), getTicketTypes(id)]).then(([event, types]) => {
      if (!active) return
      setEvent(event); setTypes(types)
      setQuantities(current => Object.fromEntries(types.map(type => [type.id, type.bookable ? Math.min(current[type.id] || 0, type.remainingQuantity) : 0])))
    }).catch(cause => { if (active) setError(bookingError(cause)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, version])
  const count = Object.values(quantities).reduce((sum, value) => sum + value, 0)
  const total = types.reduce((sum, type) => sum + type.price * (quantities[type.id] || 0), 0)
  async function submit() {
    if (!id || !count || sending.current) return
    sending.current = true; setPending(true); setSubmitError('')
    try {
      const booking = await createBooking(id, types.filter(type => quantities[type.id] > 0).map(type => ({ ticketTypeId: type.id, quantity: quantities[type.id] })))
      navigate(booking.status === 'PAID' ? `/customer/bookings/${booking.id}?success=1` : `/customer/bookings/${booking.id}/checkout`)
    } catch (cause) { setSubmitError(bookingError(cause)); reload() }
    finally { sending.current = false; setPending(false) }
  }
  return <BookingShell><div className={styles.steps}><span className={styles.active}><b>1</b> Chọn loại vé</span><span><b>2</b> Xác nhận & thanh toán</span><span><b>3</b> Nhận vé điện tử</span></div>
    <LoadState error={error} loading={loading} retry={reload} />
    {!loading && !error && event && <div className={styles.columns}>
      <div className={styles.stack}><EventSummaryCard event={{ ...event, city: event.venue.city, address: event.venue.address }} />
        {event.imageZoneUrl && <div className={styles.card}><h3>Sơ đồ phân khu</h3><img style={{ width: '100%', borderRadius: 9 }} src={event.imageZoneUrl} alt="Sơ đồ phân khu sự kiện" /></div>}
        <TicketSafety /></div>
      <div className={styles.stack}><PageHeading title="Chọn loại vé tham dự" subtitle="Chọn số lượng vé. Thời gian giữ vé bắt đầu sau khi bạn tiếp tục." />
        {types.length === 0 && <div className={styles.empty}><Ticket /><h2>Chưa có vé mở bán</h2><p>Vui lòng quay lại khi ban tổ chức mở bán.</p></div>}
        {types.map(type => <article key={type.id} className={`${styles.typeCard} ${!type.bookable ? styles.unavailable : ''}`}><div>
          <span className={`${styles.badge} ${type.bookable ? styles.green : styles.muted}`}>{type.remainingQuantity === 0 ? 'Đã hết vé' : type.bookable ? `Còn ${type.remainingQuantity} vé` : 'Chưa mở bán / đã đóng bán'}</span>
          <h3>{type.name}</h3>{type.description && <p>{type.description}</p>}<strong className={styles.price}>{formatMoney(type.price)} <small>/ vé</small></strong>
        </div><div className={styles.quantity} role="group" aria-label={`Số lượng ${type.name}`}>
          <button aria-label={`Giảm ${type.name}`} disabled={!type.bookable || !quantities[type.id] || pending} onClick={() => setQuantities(current => ({ ...current, [type.id]: (current[type.id] || 0) - 1 }))}>−</button>
          <output aria-label={`Số vé ${type.name}`}>{quantities[type.id] || 0}</output>
          <button aria-label={`Tăng ${type.name}`} disabled={!type.bookable || (quantities[type.id] || 0) >= type.remainingQuantity || count >= 100 || pending} onClick={() => setQuantities(current => ({ ...current, [type.id]: (current[type.id] || 0) + 1 }))}>+</button>
        </div></article>)}
        <section className={styles.card}><h2>Tóm tắt đơn hàng tạm tính</h2>
          {types.filter(type => quantities[type.id] > 0).map(type => <div className={styles.row} key={type.id}><span>{quantities[type.id]} × {type.name}</span><strong>{formatMoney(type.price * quantities[type.id])}</strong></div>)}
          {!count && <p className={styles.subtle}>Bạn chưa chọn vé. Vui lòng chọn ít nhất một vé để tiếp tục.</p>}
          <div className={styles.total}><span>Tổng tiền tạm tính</span><strong>{formatMoney(total)}</strong></div>
          {submitError && <p className={styles.error} role="alert">{submitError}</p>}
          <button className={`${styles.primary} ${styles.full}`} disabled={!count || pending || loading} onClick={submit}>{pending ? 'Đang giữ vé…' : `Tiếp tục (${count} vé)`}<ArrowRight size={18} /></button>
          <p className={styles.subtle} style={{ marginTop: 15, fontSize: 12 }}><ShieldCheck size={14} /> Giá chính thức được xác nhận và lưu bởi EventHub.</p>
        </section></div></div>}
  </BookingShell>
}
