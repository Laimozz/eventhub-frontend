import { useCallback } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { adminApi } from '../api/admin-api'
import { useAdminData } from '../hooks/use-admin-data'
import { LoadState, Pagination } from '../components/AdminComponents'
import { eventDate } from '../../events/event-display'
import styles from './Admin.module.css'

export function PendingEventsPage() {
  const [params, setParams] = useSearchParams()
  const query = params.toString()
  const { state } = useLocation()
  const { data, error, loading, reload } = useAdminData(useCallback((signal: AbortSignal) => adminApi.pending(query, signal), [query]))
  return <>
    <div className={styles.heading}><div><h1>Sự kiện chờ phê duyệt</h1><p>Xem hồ sơ và xét duyệt sự kiện trước khi mở bán.</p></div><button onClick={reload} disabled={loading}><RefreshCw size={17} />Làm mới</button></div>
    {state?.notice && <p role="status" className={styles.notice}>{state.notice}</p>}
    <section className={styles.panel}><h2>Danh sách hồ sơ gửi thẩm định</h2><LoadState loading={loading} error={error} retry={reload} />
      {data && <><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Sự kiện</th><th>Nhà tổ chức</th><th>Ngày tạo</th><th>Trạng thái</th></tr></thead><tbody>{data.items.map(item => <tr key={item.id}>
        <td><div className={styles.eventName}><img src={item.thumbnailImageUrl} alt="" /><div><Link to={'/admin/events/pending/' + item.id}>{item.name}</Link><small>{item.categoryName}</small></div></div></td>
        <td>{item.organizer.fullName || item.organizer.email}<small>{item.organizer.email}</small></td><td>{eventDate(item.createdAt)}</td><td><span className={styles.badge + ' ' + styles.pending}>Chờ duyệt</span></td>
      </tr>)}</tbody></table></div>{!data.items.length && <p className={styles.empty}>Không có sự kiện chờ duyệt.</p>}<Pagination {...data} change={page => setParams({ page: String(page) })} /></>}
    </section>
  </>
}
