import { useEffect, useState } from 'react'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications-api'
import type { NotificationPage } from '../api/notifications-api'
import { useNotifications } from '../hooks/useNotifications'
import styles from './NotificationsPage.module.css'

export function NotificationsPage({ standalone = false }: { standalone?: boolean }) {
  const { revision: liveRevision, unreadCount, refresh } = useNotifications()
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState<number | 'all' | null>(null)
  const [actionError, setActionError] = useState('')
  const key = page + ':' + revision + ':' + liveRevision
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

  async function markRead(id?: number) {
    if (busy !== null) return
    setBusy(id ?? 'all'); setActionError('')
    try {
      if (id === undefined) await markAllNotificationsRead()
      else await markNotificationRead(id)
      await refresh()
    } catch {
      setActionError('Không thể cập nhật trạng thái thông báo. Vui lòng thử lại.')
    } finally {
      setBusy(null)
    }
  }

  async function reload() {
    setActionError('')
    try { await refresh() } catch { setRevision(value => value + 1) }
  }

  return <section className={`${styles.page} ${standalone ? styles.standalone : ''}`}><header><div><h1>Thông báo</h1><p>Cập nhật hoạt động và sự kiện dành cho bạn.</p></div><div className={styles.actions}><button disabled={busy !== null || unreadCount === 0} onClick={() => { void markRead() }}>{busy === 'all' ? 'Đang cập nhật…' : 'Đánh dấu tất cả đã đọc'}</button><button disabled={loading || busy !== null} onClick={() => { void reload() }}>Làm mới</button></div></header>
    {actionError && <p role="alert">{actionError}</p>}
    {loading && <p role="status">Đang tải thông báo…</p>}
    {error && <div><p role="alert">{error}</p><button onClick={() => setRevision(value => value + 1)}>Thử lại</button></div>}
    {data && <>{data.items.length ? data.items.map(item => <article key={item.id} className={!item.read ? styles.unread : ''}><div className={styles.itemHeading}><h2>{item.title || 'Thông báo hệ thống'}</h2><span className={item.read ? styles.readLabel : styles.unreadLabel}>{item.read ? 'Đã đọc' : 'Chưa đọc'}</span></div><p>{item.content}</p><div className={styles.itemFooter}><time dateTime={item.createdAt + 'Z'}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.createdAt + 'Z'))}</time>{!item.read && <button disabled={busy !== null} onClick={() => { void markRead(item.id) }}>{busy === item.id ? 'Đang cập nhật…' : 'Đánh dấu đã đọc'}</button>}</div></article>) : <p>Chưa có thông báo.</p>}
      <footer><span>{data.totalElements} thông báo</span><button disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button><button disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Sau</button></footer></>}
  </section>
}
