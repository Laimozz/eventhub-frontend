import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../lib/http-client'
import { Link, useNavigate, useParams } from 'react-router'
import { adminApi, errorMessage } from '../api/admin-api'
import { useAdminData } from '../hooks/use-admin-data'
import { Dialog, LoadState } from '../components/AdminComponents'
import { eventDate } from '../../events/event-display'
import styles from './Admin.module.css'

export function EventReviewDetailPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAdminData(useCallback((signal: AbortSignal) => adminApi.detail(eventId, signal), [eventId]))
  const [mode, setMode] = useState<'approve' | 'reject'>()
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [formError, setFormError] = useState('')
  const [stale, setStale] = useState(false)
  const event = data?.event
  function close() { if (!sending.current) setMode(undefined) }
  async function decide(submit: FormEvent<HTMLFormElement>) {
    submit.preventDefault()
    if (sending.current || !data || stale) return
    const reason = String(new FormData(submit.currentTarget).get('reason') ?? '').trim()
    if (mode === 'reject' && !reason) { setFormError('Vui lòng nhập lý do từ chối.'); return }
    sending.current = true; setBusy(true); setFormError('')
    try {
      if (mode === 'approve') await adminApi.approve(data.event.id, data.version)
      else await adminApi.reject(data.event.id, data.version, reason)
      navigate('/admin/events/pending', { replace: true, state: { notice: mode === 'approve' ? 'Đã duyệt sự kiện và thông báo cho Nhà tổ chức.' : 'Đã từ chối sự kiện và thông báo lý do cho Nhà tổ chức.' } })
    } catch (cause) {
      setFormError(errorMessage(cause))
      if (cause instanceof ApiError && [404, 409].includes(cause.status)) { setStale(true); setMode(undefined) }
    } finally { sending.current = false; setBusy(false) }
  }
  return <>
    <Link to="/admin/events/pending">← Danh sách chờ duyệt</Link>
    <LoadState loading={loading} error={error} retry={reload} />
    {stale && <div className={styles.error}><p role="alert">{formError}</p><button onClick={() => { setStale(false); setFormError(''); reload() }}>Tải lại hồ sơ</button></div>}
    {event && <><div className={styles.heading}><div><h1>{event.name}</h1><span className={styles.badge + ' ' + styles.pending}>Chờ duyệt</span></div><div className={styles.actions}><button className={styles.danger} disabled={busy || stale} onClick={() => { setFormError(''); setMode('reject') }}>Từ chối</button><button className={styles.primary} disabled={busy || stale} onClick={() => { setFormError(''); setMode('approve') }}>Duyệt sự kiện</button></div></div>
      <div className={styles.detailGrid}><div><section className={styles.panel}><img className={styles.banner} src={event.bannerImageUrl} alt="Ảnh bìa sự kiện" /><h2>Thông tin sự kiện</h2><p className={styles.description}>{event.description}</p>
        <dl><dt>Danh mục</dt><dd>{event.categoryName}</dd><dt>Thành phố</dt><dd>{event.venue.city}</dd><dt>Địa chỉ</dt><dd>{event.venue.address}</dd><dt>Sức chứa</dt><dd>{event.venue.capacity.toLocaleString('vi-VN')} người</dd><dt>Bắt đầu</dt><dd>{eventDate(event.startTime)}</dd><dt>Kết thúc</dt><dd>{eventDate(event.endTime)}</dd></dl>
        {event.imageZoneUrl && <><h2>Sơ đồ chỗ ngồi</h2><img className={styles.banner} src={event.imageZoneUrl} alt="Sơ đồ chỗ ngồi" /></>}
      </section><section className={styles.panel}><h2>Loại vé ({event.ticketTypes.length})</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Loại vé</th><th>Số lượng</th><th>Giá vé</th><th>Thời gian bán</th></tr></thead><tbody>{event.ticketTypes.map(ticket => <tr key={ticket.id}><td><div className={styles.eventName}><img src={ticket.imageUrl} alt="" /><div><strong>{ticket.name}</strong><small>{ticket.description}</small></div></div></td><td>{ticket.quantity}</td><td>{Number(ticket.price).toLocaleString('vi-VN')} ₫</td><td>{eventDate(ticket.saleStartTime)}<small>đến {eventDate(ticket.saleEndTime)}</small></td></tr>)}</tbody></table></div></section></div>
      <aside><section className={styles.panel}><h2>Nhà tổ chức</h2><strong>{data.organizer.fullName}</strong><p>{data.organizer.email}</p><dl><dt>Mã hồ sơ</dt><dd>#{event.id}</dd><dt>Ngày tạo</dt><dd>{eventDate(event.createdAt)}</dd></dl><img className={styles.banner} src={event.thumbnailImageUrl} alt="Ảnh đại diện sự kiện" /></section>
        <section className={styles.panel}><h2>Khách mời</h2>{event.guests.length ? event.guests.map(guest => <article className={styles.guest} key={guest.id}>{guest.imageUrl && <img src={guest.imageUrl} alt="" />}<div><strong>{guest.name}</strong><p>{guest.role}</p><p>{guest.description}</p></div></article>) : <p>Chưa có khách mời.</p>}</section>
      </aside></div>
    </>}
    {mode && <Dialog title={mode === 'approve' ? 'Xác nhận duyệt sự kiện' : 'Từ chối sự kiện'} busy={busy} close={close}><form onSubmit={decide}>
      {mode === 'approve' ? <p>Bạn có chắc chắn muốn duyệt sự kiện này?</p> : <label>Lý do từ chối<textarea name="reason" required maxLength={255} autoFocus /><small>Tối đa 255 ký tự. Lý do sẽ được gửi đến Nhà tổ chức.</small></label>}
      {formError && <p role="alert" className={styles.error}>{formError}</p>}<div className={styles.actions}><button type="button" disabled={busy} onClick={close}>Hủy bỏ</button><button disabled={busy} className={mode === 'approve' ? styles.primary : styles.danger}>{busy ? 'Đang xử lý…' : mode === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}</button></div>
    </form></Dialog>}
  </>
}
