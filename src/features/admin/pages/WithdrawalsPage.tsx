import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { financeApi, financeDate, financePage, money, withdrawalStatus } from '../api/admin-finance-api'
import { useAdminData } from '../hooks/use-admin-data'
import { LoadState, Pagination } from '../components/AdminComponents'
import styles from './Admin.module.css'

export function WithdrawalsPage() {
  const [params, setParams] = useSearchParams()
  const page = financePage(params.get('page'))
  const status = params.get('status') ?? ''
  const load = useCallback((signal: AbortSignal) => financeApi.withdrawals(page, status, signal), [page, status])
  const { data, loading, error, reload } = useAdminData(load)
  return <>
    <div className={styles.heading}><div><h1>Yêu cầu rút tiền</h1><p>Xem và xử lý yêu cầu từ Nhà tổ chức</p></div></div>
    <section className={styles.panel}>
      <div className={styles.filters}><label>Trạng thái<select value={status} onChange={e => setParams(e.target.value ? { status: e.target.value } : {})}><option value="">Tất cả</option>{['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{withdrawalStatus(s)}</option>)}</select></label></div>
      <LoadState loading={loading} error={error} retry={reload} />
      {data && <>{data.items.length === 0 ? <p className={styles.empty}>Không có yêu cầu rút tiền phù hợp.</p> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Nhà tổ chức</th><th>Số tiền</th><th>Ngân hàng</th><th>Trạng thái</th><th>Ngày yêu cầu</th><th>Chi tiết</th></tr></thead><tbody>{data.items.map(r => <tr key={r.id}><td>{r.organizer.fullName}<small>{r.organizer.email}</small></td><td>{money(r.amount)}</td><td>{r.bankName}</td><td><span className={styles.badge}>{withdrawalStatus(r.status)}</span></td><td>{financeDate(r.requestedAt)}</td><td><Link to={`/admin/withdrawals/${r.id}`}>Xem #{r.id}</Link></td></tr>)}</tbody></table></div>}
        <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} change={next => setParams({ ...(status ? { status } : {}), page: String(next) })} /></>}
    </section>
  </>
}
