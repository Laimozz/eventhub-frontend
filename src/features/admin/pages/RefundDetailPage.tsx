import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { financeApi, financeDate, financePage, money } from '../api/admin-finance-api'
import { useAdminData } from '../hooks/use-admin-data'
import { LoadState, Pagination } from '../components/AdminComponents'
import styles from './Admin.module.css'
import { RefundManagement } from '../components/RefundManagement'

export function RefundDetailPage() {
  const { eventId } = useParams()
  const [params, setParams] = useSearchParams()
  const id = Number(eventId), page = financePage(params.get('page'))
  const load = useCallback((signal: AbortSignal) => financeApi.refundDetail(id, page, signal), [id, page])
  const { data, loading, error, reload } = useAdminData(load)
  return <><div className={styles.heading}><div><Link to="/admin/refunds">← Sự kiện đã hủy</Link><h1>{data?.eventName ?? `Sự kiện #${eventId}`}</h1></div></div>
    <LoadState loading={loading} error={error} retry={reload} />
    {data && <section className={styles.panel}><p>Lý do hủy: {data.cancelReason ?? '—'}</p><p className={styles.notice}>{data.unavailableReason}</p>
      <h2>Giao dịch và lịch sử hoàn tiền</h2><p>Trạng thái được hiển thị theo dữ liệu đã lưu. Danh sách này chưa phân loại giao dịch đủ điều kiện hoàn tiền.</p>
      {data.payments.items.length === 0 ? <p className={styles.empty}>Không có giao dịch thanh toán.</p> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Khách hàng</th><th>Thanh toán</th><th>Trạng thái thanh toán</th><th>Hoàn tiền</th><th>Trạng thái hoàn tiền</th></tr></thead><tbody>{data.payments.items.map(p => <tr key={p.id}><td>{p.customerName ?? '—'}<small>Booking #{p.bookingId} • Payment #{p.id}</small></td><td>{money(p.paidAmount)}<small>{financeDate(p.paidAt)}</small></td><td>{p.paymentStatus ?? '—'}</td><td>{p.refundAmount === null ? '—' : money(p.refundAmount)}<small>{financeDate(p.refundedAt)}</small></td><td>{p.refundStatus ?? 'Chưa có'}{p.retryCount !== null && <small>Số lần thử lại: {p.retryCount}</small>}</td></tr>)}</tbody></table></div>}
      <Pagination page={page} totalPages={data.payments.totalPages} totalElements={data.payments.totalElements} change={next => setParams({ page: String(next) })} />
    </section>}
    {data && <RefundManagement key={id} eventId={id} />}
  </>
}
