import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { financeApi, financePage } from '../api/admin-finance-api'
import { useAdminData } from '../hooks/use-admin-data'
import { LoadState, Pagination } from '../components/AdminComponents'
import styles from './Admin.module.css'

export function RefundEventsPage() {
  const [params, setParams] = useSearchParams()
  const page = financePage(params.get('page'))
  const load = useCallback((signal: AbortSignal) => financeApi.canceledEvents(page, signal), [page])
  const { data, loading, error, reload } = useAdminData(load)
  return <><div className={styles.heading}><div><h1>Sự kiện đã hủy</h1><p>Đối soát giao dịch và lịch sử hoàn tiền</p></div></div><section className={styles.panel}>
    <p className={styles.notice}>Chỉ hiển thị sự kiện đã hủy chính thức. Sự kiện đang chờ hủy chưa đủ điều kiện hoàn tiền.</p>
    <LoadState loading={loading} error={error} retry={reload} />
    {data && <>{data.items.length === 0 ? <p className={styles.empty}>Chưa có sự kiện đã hủy.</p> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Sự kiện</th><th>Nhà tổ chức</th><th>Lý do hủy</th><th>Chi tiết</th></tr></thead><tbody>{data.items.map(e => <tr key={e.id}><td>{e.name}</td><td>{e.organizer.fullName}</td><td>{e.cancelReason ?? '—'}</td><td><Link to={`/admin/refunds/${e.id}`}>Xem giao dịch</Link></td></tr>)}</tbody></table></div>}<Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} change={next => setParams({ page: String(next) })} /></>}
  </section></>
}
