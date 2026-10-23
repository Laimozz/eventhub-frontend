import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { financeApi, financeDate, financePage, money } from '../api/admin-finance-api'
import type { RefundReconciliation } from '../types/finance'
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
  const [recon, setRecon] = useState<RefundReconciliation | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    financeApi.refundReconciliation(id, controller.signal)
      .then(setRecon)
      .catch(() => null)
    return () => controller.abort()
  }, [id])

  return <><div className={styles.heading}><div><Link to="/admin/refunds">← Sự kiện đã hủy</Link><h1>{data?.eventName ?? `Sự kiện #${eventId}`}</h1></div></div>
    <LoadState loading={loading} error={error} retry={reload} />
    {recon && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TỔNG CẦN HOÀN TRẢ</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{recon.formattedTotalAmount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{recon.totalPayments} đơn vé thành công</div>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>ĐÃ HOÀN TIỀN THÀNH CÔNG</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>{recon.formattedRefundedAmount}</div>
          <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>{recon.refundedCount} / {recon.totalPayments} đơn</div>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>ĐANG CHỜ / XẾP HÀNG</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#b45309', marginTop: '6px' }}>{recon.pendingRefundCount} đơn</div>
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>Hệ thống đang xử lý</div>
        </div>
        <div style={{ background: recon.retryNeededCount > 0 ? '#fef2f2' : '#f8fafc', border: `1px solid ${recon.retryNeededCount > 0 ? '#fecaca' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', color: recon.retryNeededCount > 0 ? '#991b1b' : '#64748b', fontWeight: 600 }}>CẦN ĐỐI SOÁT / LỖI</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: recon.retryNeededCount > 0 ? '#b91c1c' : '#0f172a', marginTop: '6px' }}>{recon.retryNeededCount} đơn</div>
          <div style={{ fontSize: '12px', color: recon.retryNeededCount > 0 ? '#991b1b' : '#64748b', marginTop: '4px' }}>Cần Admin kiểm tra</div>
        </div>
      </div>
    )}
    {data && <section className={styles.panel}><p>Lý do hủy: {data.cancelReason ?? '—'}</p><p className={styles.notice}>{data.unavailableReason}</p>
      <h2>Giao dịch và lịch sử hoàn tiền</h2><p>Trạng thái được hiển thị theo dữ liệu đã lưu. Danh sách này chưa phân loại giao dịch đủ điều kiện hoàn tiền.</p>
      {data.payments.items.length === 0 ? <p className={styles.empty}>Không có giao dịch thanh toán.</p> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Khách hàng</th><th>Thanh toán</th><th>Trạng thái thanh toán</th><th>Hoàn tiền</th><th>Trạng thái hoàn tiền</th></tr></thead><tbody>{data.payments.items.map(p => <tr key={p.id}><td>{p.customerName ?? '—'}<small>Booking #{p.bookingId} • Payment #{p.id}</small></td><td>{money(p.paidAmount)}<small>{financeDate(p.paidAt)}</small></td><td>{p.paymentStatus ?? '—'}</td><td>{p.refundAmount === null ? '—' : money(p.refundAmount)}<small>{financeDate(p.refundedAt)}</small></td><td>{p.refundStatus ?? 'Chưa có'}{p.retryCount !== null && <small>Số lần thử lại: {p.retryCount}</small>}</td></tr>)}</tbody></table></div>}
      <Pagination page={page} totalPages={data.payments.totalPages} totalElements={data.payments.totalElements} change={next => setParams({ page: String(next) })} />
    </section>}
    {data && <RefundManagement key={id} eventId={id} />}
  </>
}

