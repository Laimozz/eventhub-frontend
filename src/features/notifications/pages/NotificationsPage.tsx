import { useEffect, useState } from 'react'
import { getNotifications } from '../api/notifications-api'
import type { NotificationPage } from '../api/notifications-api'
import styles from './NotificationsPage.module.css'

export function NotificationsPage() {
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const key = page + ':' + revision
  const [result, setResult] = useState<{ key: string; data?: NotificationPage; error: string }>()
  const current = result?.key === key ? result : undefined
  const data = current?.data
  const error = current?.error ?? ''
  const loading = !current
  useEffect(() => {
    const controller = new AbortController()
    getNotifications(page, controller.signal).then(data => { if (!controller.signal.aborted) setResult({ key, data, error: '' }) })
      .catch(() => { if (!controller.signal.aborted) setResult({ key, error: 'Không thể tải thông báo. Vui lòng thử lại.' }) })
    return () => controller.abort()
  }, [page, key])
  return <section className={styles.page}><header><div><h1>Thông báo</h1><p>Kết quả xét duyệt và cập nhật sự kiện của bạn.</p></div><button disabled={loading} onClick={() => setRevision(value => value + 1)}>Làm mới</button></header>
    {loading && <p role="status">Đang tải thông báo…</p>}
    {error && <div><p role="alert">{error}</p><button onClick={() => setRevision(value => value + 1)}>Thử lại</button></div>}
    {data && <>{data.items.length ? data.items.map(item => <article key={item.id}><h2>{item.title}</h2><p>{item.content}</p><time>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.createdAt + 'Z'))}</time></article>) : <p>Chưa có thông báo.</p>}
      <footer><span>{data.totalElements} thông báo</span><button disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button><button disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Sau</button></footer></>}
  </section>
}
