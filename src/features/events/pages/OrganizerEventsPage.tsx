import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CalendarDays, ChevronLeft, ChevronRight, CirclePlus, Clock3, MapPin, Pencil, Search, Ticket, XCircle } from 'lucide-react'
import { getOrganizerEvents } from '../api/event-api'
import { CancelEventDialog } from '../components/CancelEventDialog'
import { eventDate, eventStatuses } from '../event-display'
import { eventError } from '../event-form'
import type { EventList, EventStatus, EventSummary } from '../types/event'
import styles from './OrganizerEventsPage.module.css'

export function OrganizerEventsPage() {
  const [params, setParams] = useSearchParams()
  const search = (params.get('search') ?? '').slice(0, 255)
  const rawStatus = params.get('status') ?? ''
  const status = Object.hasOwn(eventStatuses, rawStatus) ? rawStatus as EventStatus : undefined
  const rawPage = Number(params.get('page') ?? 0)
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0
  const [result, setResult] = useState<{ key: string; data: EventList | null; error: string } | null>(null)
  const [reload, setReload] = useState(0)
  const [canceling, setCanceling] = useState<EventSummary | null>(null)
  const [notice, setNotice] = useState('')
  const key = `${page}:${status}:${search}:${reload}`
  const loading = result?.key !== key
  const data = result?.data
  const error = result?.key === key ? result.error : ''
  useEffect(() => {
    const controller = new AbortController()
    getOrganizerEvents({ page, size: 9, search, status }, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return
        setResult({ key, data: result, error: '' })
        if (result.totalPages > 0 && page >= result.totalPages) {
          setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String(result.totalPages - 1)); return next }, { replace: true })
        }
      })
      .catch(cause => { if (!controller.signal.aborted) setResult({ key, data: null, error: eventError(cause) }) })
    return () => controller.abort()
  }, [page, search, status, key, setParams])
  function filter(nextStatus?: EventStatus, nextSearch = search, nextPage = 0) {
    const next = new URLSearchParams()
    if (nextStatus) next.set('status', nextStatus)
    if (nextSearch.trim()) next.set('search', nextSearch.trim())
    if (nextPage) next.set('page', String(nextPage))
    setParams(next)
  }
  const counts = data?.statusCounts
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : 0
  return <div className={styles.page}>
    <div className={styles.breadcrumb}><Link to="/organizer">Tổng quan</Link><ChevronRight size={13} />Quản lý sự kiện</div>
    <div className={styles.heading}><div><span className={styles.eyebrow}>KHÔNG GIAN BAN TỔ CHỨC</span><h1>Sự kiện của tôi</h1><p>Theo dõi thông tin và quản lý các sự kiện do bạn tổ chức.</p></div><Link className={styles.primary} to="/organizer/events/new/details"><CirclePlus size={17} />Tạo sự kiện mới</Link></div>
    <div className={styles.stats}>{[{ label: 'TỔNG SỰ KIỆN', value: total, icon: Ticket, tone: 'green' }, { label: 'CHỜ DUYỆT', value: counts?.PENDING_APPROVAL, icon: Clock3, tone: 'amber' }, { label: 'ĐÃ DUYỆT', value: counts?.APPROVED, icon: CalendarDays, tone: 'blue' }, { label: 'CHỜ HỦY', value: counts?.PENDING_CANCELLATION, icon: XCircle, tone: 'red' }].map(({ label, value, icon: Icon, tone }) => <article className={`${styles.stat} ${styles[tone]}`} key={label}><div><span>{label}</span><Icon size={19} /></div><strong>{data ? (value ?? 0).toLocaleString('vi-VN') : '—'}</strong><small>sự kiện</small></article>)}</div>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <nav className={styles.filters} aria-label="Lọc trạng thái sự kiện"><button className={!status ? styles.selected : ''} onClick={() => filter()} aria-pressed={!status}>Tất cả <span>{total}</span></button>{Object.entries(eventStatuses).map(([key, item]) => <button key={key} className={status === key ? styles.selected : ''} aria-pressed={status === key} onClick={() => filter(key as EventStatus)}>{item.label}<span>{counts?.[key as EventStatus] ?? 0}</span></button>)}</nav>
    <form className={styles.toolbar} onSubmit={e => { e.preventDefault(); filter(status, String(new FormData(e.currentTarget).get('search') ?? '')) }}><div className={styles.search}><Search size={17} /><input aria-label="Tìm sự kiện theo tên" placeholder="Tìm theo tên sự kiện…" key={search} name="search" defaultValue={search} maxLength={255} /></div><button className={styles.secondary}>Tìm kiếm</button><small>Mới nhất trước</small></form>
    {loading ? <div className={styles.empty} role="status">Đang tải danh sách sự kiện…</div> : error ? <div className={styles.empty}><p role="alert">{error}</p><button className={styles.secondary} onClick={() => setReload(value => value + 1)}>Thử lại</button></div> : !data?.content.length ? <div className={styles.empty}><CalendarDays size={42} /><h2>{search || status ? 'Không tìm thấy sự kiện phù hợp' : 'Chưa có sự kiện nào'}</h2><p>{search || status ? 'Thử một tên khác hoặc bỏ bộ lọc trạng thái.' : 'Tạo sự kiện đầu tiên và gửi hồ sơ cho Admin xét duyệt.'}</p>{search || status ? <button className={styles.secondary} onClick={() => filter(undefined, '')}>Bỏ bộ lọc</button> : <Link className={styles.primary} to="/organizer/events/new/details"><CirclePlus size={17} />Tạo sự kiện mới</Link>}</div> : <>
      <div className={styles.grid}>{data.content.map(event => <article className={styles.eventCard} key={event.id}>
        <Link className={styles.poster} to={`/organizer/events/${event.id}`}><img src={event.thumbnailImageUrl} alt={event.name} /><span className={`${styles.badge} ${styles[eventStatuses[event.status].tone]}`}>{eventStatuses[event.status].label}</span></Link>
        <div className={styles.cardBody}><small className={styles.category}>{event.categoryName} · #{event.id}</small><h2><Link to={`/organizer/events/${event.id}`}>{event.name}</Link></h2><p><CalendarDays size={14} />{eventDate(event.startTime)}</p><p><MapPin size={14} />{event.address}, {event.city}</p>{event.description && <div className={styles.description}>{event.description}</div>}</div>
        <div className={styles.actions}><Link className={styles.primary} to={`/organizer/events/${event.id}`}>Xem chi tiết</Link>{event.canEdit && <Link className={styles.iconButton} to={`/organizer/events/${event.id}/edit/details`} aria-label={`Sửa ${event.name}`}><Pencil size={16} /></Link>}{event.canCancel && <button className={styles.cancelButton} onClick={() => setCanceling(event)} aria-label={`Hủy ${event.name}`}><XCircle size={17} /></button>}</div>
      </article>)}<Link className={styles.newCard} to="/organizer/events/new/details"><CirclePlus size={35} /><strong>Tạo thêm sự kiện mới</strong><span>Bắt đầu một trải nghiệm tiếp theo</span></Link></div>
      <div className={styles.pagination}><small>Hiển thị {page * data.size + 1}–{page * data.size + data.content.length} trong {data.totalElements} sự kiện</small><div><button className={styles.secondary} disabled={page === 0} aria-label="Trang trước" onClick={() => filter(status, search, page - 1)}><ChevronLeft size={17} /></button><span>Trang {page + 1} / {data.totalPages}</span><button className={styles.secondary} disabled={page + 1 >= data.totalPages} aria-label="Trang sau" onClick={() => filter(status, search, page + 1)}><ChevronRight size={17} /></button></div></div>
    </>}
    {canceling && <CancelEventDialog event={canceling} onClose={() => setCanceling(null)} onCanceled={() => { setCanceling(null); setNotice('Đã gửi yêu cầu hủy sự kiện. Vui lòng chờ Admin xét duyệt.'); setReload(value => value + 1) }} />}
  </div>
}
