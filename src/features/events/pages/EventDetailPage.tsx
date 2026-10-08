import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { CalendarDays, ChevronRight, MapPin, Pencil, Ticket, Users, XCircle } from 'lucide-react'
import { CancelEventDialog } from '../components/CancelEventDialog'
import { useEvent } from '../hooks/use-event'
import { eventDate, eventStatuses } from '../event-display'
import { money } from '../event-form'
import styles from './OrganizerEventsPage.module.css'

export function EventDetailPage() {
  const { eventId } = useParams()
  const { event, setEvent, loading, error, retry } = useEvent(eventId)
  const location = useLocation()
  const [canceling, setCanceling] = useState(false)
  const [notice, setNotice] = useState((location.state as { message?: string } | null)?.message ?? '')
  if (loading) return <div className={styles.empty} role="status">Đang tải thông tin sự kiện…</div>
  if (error || !event) return <div className={styles.empty}><p role="alert">{error || 'Không tìm thấy sự kiện.'}</p><div className={styles.inlineActions}><Link className={styles.secondary} to="/organizer/events">Về danh sách</Link><button className={styles.secondary} onClick={retry}>Thử lại</button></div></div>
  const status = eventStatuses[event.status]
  const issued = event.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0)
  const remaining = event.ticketTypes.reduce((sum, ticket) => sum + ticket.remainingQuantity, 0)
  const reserved = event.ticketTypes.reduce((sum, ticket) => sum + ticket.reservedQuantity, 0)
  return <div className={styles.page}>
    <div className={styles.breadcrumb}><Link to="/organizer/events">Sự kiện của tôi</Link><ChevronRight size={13} />Chi tiết sự kiện<ChevronRight size={13} />#{event.id}</div>
    <div className={styles.heading}><div><h1>{event.name}</h1><div className={styles.meta}><span className={`${styles.badge} ${styles[status.tone]}`}>{status.label}</span><span>{event.categoryName}</span><span><MapPin size={14} />{event.venue.city}</span></div></div><div className={styles.inlineActions}>{event.canEdit && <Link className={styles.secondary} to={`/organizer/events/${event.id}/edit/details`}><Pencil size={16} />Chỉnh sửa thông tin</Link>}{event.canCancel && <button className={styles.danger} onClick={() => setCanceling(true)}><XCircle size={16} />Hủy sự kiện</button>}</div></div>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {event.rejectReason && <div className={styles.cancellation}><strong>Sự kiện bị từ chối</strong><p>Lý do: {event.rejectReason}</p></div>}
    {event.cancelReason && <div className={styles.cancellation}><strong>{event.status === 'PENDING_CANCELLATION' ? 'Yêu cầu hủy đang chờ Admin xét duyệt' : 'Thông tin hủy sự kiện'}</strong><p>Lý do: {event.cancelReason}</p>{event.canceledAt && <p>Đã hủy lúc: {eventDate(event.canceledAt)}</p>}</div>}
    <img className={styles.banner} src={event.bannerImageUrl} alt={`Ảnh bìa ${event.name}`} />
    <div className={styles.stats}>{[{ label: 'VÉ PHÁT HÀNH', value: issued }, { label: 'VÉ ĐÃ BÁN', value: issued - remaining - reserved }, { label: 'VÉ GIỮ CHỖ', value: reserved }, { label: 'VÉ CÒN LẠI', value: remaining }].map(item => <article className={styles.stat} key={item.label}><div><span>{item.label}</span><Ticket size={19} /></div><strong>{item.value.toLocaleString('vi-VN')}</strong><small>vé</small></article>)}</div>
    <div className={styles.detailGrid}><div className={styles.mainColumn}>
      <section className={styles.panel}><h2><CalendarDays size={20} />Thông tin tổ chức & Địa điểm</h2><div className={styles.infoGrid}><div><small>THỜI GIAN SỰ KIỆN · GMT+7</small><strong>{eventDate(event.startTime)}</strong><span>Đến {eventDate(event.endTime)}</span></div><div><small>ĐỊA ĐIỂM TỔ CHỨC</small><strong>{event.venue.address}</strong><span>{event.venue.city}</span></div></div><div className={styles.capacity}><Users size={20} /><div><small>Sức chứa địa điểm</small><strong>{event.venue.capacity.toLocaleString('vi-VN')} người</strong></div></div>{event.description && <div className={styles.eventDescription}><h3>Giới thiệu sự kiện</h3><p>{event.description}</p></div>}{event.imageZoneUrl && <div className={styles.zone}><h3>Sơ đồ khu vực / Chỗ ngồi</h3><img src={event.imageZoneUrl} alt="Sơ đồ khu vực sự kiện" /></div>}</section>
      <section className={styles.panel}><div className={styles.panelHeading}><h2><Ticket size={20} />Danh sách loại vé</h2><span>{event.ticketTypes.length} loại vé</span></div><div className={styles.tableWrap}><table><thead><tr><th>Loại vé</th><th>Đơn giá</th><th>Phát hành</th><th>Đã bán</th><th>Giữ chỗ</th><th>Còn lại</th></tr></thead><tbody>{event.ticketTypes.map(ticket => <tr key={ticket.id}><td><div className={styles.ticketName}><img src={ticket.imageUrl} alt={`Ảnh ${ticket.name}`} /><div><strong>{ticket.name}</strong>{ticket.description && <p>{ticket.description}</p>}<small>{ticket.status === 'ACTIVE' ? 'Đang bán' : 'Tạm ngừng bán'}</small></div></div><p className={styles.saleTime}>Bán từ {eventDate(ticket.saleStartTime)}<br />đến {eventDate(ticket.saleEndTime)}</p></td><td>{money(ticket.price)}</td><td>{ticket.quantity.toLocaleString('vi-VN')}</td><td>{(ticket.quantity - ticket.remainingQuantity - ticket.reservedQuantity).toLocaleString('vi-VN')}</td><td>{ticket.reservedQuantity.toLocaleString('vi-VN')}</td><td>{ticket.remainingQuantity.toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></section>
    </div><aside className={styles.mainColumn}><section className={styles.panel}><h2><Users size={20} />Khách mời & Nghệ sĩ</h2>{event.guests.length ? <div className={styles.guests}>{event.guests.map(guest => <article key={guest.id}>{guest.imageUrl ? <img src={guest.imageUrl} alt={guest.name} /> : <span className={styles.guestPlaceholder}><Users size={23} /></span>}<div><strong>{guest.name}</strong><span>{guest.role}</span>{guest.description && <p>{guest.description}</p>}</div></article>)}</div> : <p className={styles.muted}>Chưa có khách mời.</p>}</section><section className={styles.panel}><h2>Thông tin hồ sơ</h2><div className={styles.recordInfo}><p>Mã sự kiện <strong>#{event.id}</strong></p><p>Ngày tạo <strong>{eventDate(event.createdAt)}</strong></p><p>Trạng thái <strong>{status.label}</strong></p></div><p className={styles.muted}>Các thay đổi thông tin cần được Admin duyệt lại trước khi mở bán.</p></section></aside></div>
    {canceling && <CancelEventDialog event={event} onClose={() => setCanceling(false)} onCanceled={result => { setEvent(result); setCanceling(false); setNotice('Đã gửi yêu cầu hủy sự kiện. Vui lòng chờ Admin xét duyệt.') }} />}
  </div>
}
