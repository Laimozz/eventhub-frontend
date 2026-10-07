import { Link, useParams } from 'react-router'
import { useEvent } from '../hooks/use-event'
import { CreateEventPage } from './CreateEventPage'
import styles from './OrganizerEventsPage.module.css'

export function EditEventPage() {
  const { eventId } = useParams()
  const { event, loading, error, retry } = useEvent(eventId)
  if (loading) return <div className={styles.empty} role="status">Đang tải hồ sơ chỉnh sửa…</div>
  if (error || !event) return <div className={styles.empty}><p role="alert">{error || 'Không tìm thấy sự kiện.'}</p><div className={styles.inlineActions}><Link to="/organizer/events" className={styles.secondary}>Về danh sách</Link><button className={styles.secondary} onClick={retry}>Thử lại</button></div></div>
  if (!event.canEdit) return <div className={styles.empty}><h2>Sự kiện không thể chỉnh sửa</h2><p>Chỉ sửa sự kiện chờ duyệt hoặc đã duyệt trước thời gian bắt đầu.</p><Link className={styles.secondary} to={`/organizer/events/${event.id}`}>Về chi tiết sự kiện</Link></div>
  return <CreateEventPage key={event.id} initialEvent={event} />
}
