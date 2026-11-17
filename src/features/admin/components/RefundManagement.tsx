import { useCallback, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { financeApi, financeDate, money } from '../api/admin-finance-api'
import { errorMessage } from '../api/admin-api'
import { useAdminData } from '../hooks/use-admin-data'
import { Dialog, LoadState, Pagination } from './AdminComponents'
import styles from '../pages/Admin.module.css'
import ui from './RefundManagement.module.css'

const statusLabel = (status: string) => ({ WAITING: 'Chờ hoàn tiền', QUEUED: 'Đã xếp hàng', PROCESSING: 'Đang hoàn tiền',
  RECONCILIATION: 'Cần đối soát', FAILED: 'Bị từ chối', COMPLETED: 'Đã hoàn tiền' } as Record<string, string>)[status] ?? status
function RefundBadge({ status }: { status: string }) {
  return <span className={`${ui.badge} ${status === 'COMPLETED' ? ui.completed : ['FAILED', 'RECONCILIATION'].includes(status) ? ui.warning : ['QUEUED', 'PROCESSING'].includes(status) ? ui.processing : ''}`}>{statusLabel(status)}</span>
}

export function RefundManagement({ eventId, canRefund = true, unavailableReason = '' }: {
  eventId?: number; canRefund?: boolean; unavailableReason?: string
}) {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmBatch, setConfirmBatch] = useState(false)
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const load = useCallback((signal: AbortSignal) => financeApi.refunds(eventId, page, signal), [eventId, page])
  const { data, loading, error, reload } = useAdminData(load)
  function refresh() { reload() }
  async function batch() {
    if (!eventId || sending.current || !canRefund) return
    sending.current = true; setBusy(true); setActionError(''); setNotice('')
    try {
      const result = await financeApi.refundEvent(eventId)
      setNotice(result.refundedCount > 0 ? `Đã hoàn tiền ${result.refundedCount} giao dịch.` : 'Không có khoản mới đủ điều kiện hoàn tiền.')
      setConfirmBatch(false)
    } catch (cause) { setActionError(errorMessage(cause)) }
    finally { sending.current = false; setBusy(false); reload() }
  }
  return <section className={`${styles.panel} ${ui.root}`}>
    <div className={ui.toolbar}><div><h2>{eventId ? 'Hoàn tiền cho sự kiện' : 'Theo dõi hoàn tiền'}</h2>
      <p>{eventId ? 'Admin xác nhận hoàn tiền cho các giao dịch đủ điều kiện.' : 'Chọn một khoản để xem chi tiết hoặc hoàn tiền.'}</p>
    </div><div className={ui.actions}>
      <button onClick={refresh} disabled={busy} aria-label="Cập nhật trạng thái"><RefreshCw size={16} /> Làm mới</button>
      {eventId && <button className={ui.primary} disabled={loading || busy || Boolean(error) || !canRefund}
        onClick={() => { setActionError(''); setConfirmBatch(true) }}>Hoàn tiền hàng loạt</button>}
    </div></div>
    {!canRefund && <p role="alert" className={ui.alert}>{unavailableReason || 'Sự kiện chưa đủ điều kiện hoàn tiền.'}</p>}
    {notice && <p role="status" className={ui.feedback}>{notice}</p>}
    {actionError && !confirmBatch && <p role="alert" className={ui.alert}>{actionError}</p>}
    <LoadState loading={loading} error={error} retry={reload} />
    {data && <>{data.items.length === 0 ? <p className={ui.empty}>Chưa có hồ sơ hoàn tiền.</p> : <div className={styles.tableWrap}>
      <table className={`${styles.table} ${ui.table}`}><thead><tr><th>Khách hàng</th><th>Số tiền</th><th>Trạng thái</th><th><span className={ui.visuallyHidden}>Chi tiết</span></th></tr></thead>
        <tbody>{data.items.map(item => <tr key={item.id}>
          <td><strong>{item.customerName || 'Khách hàng'}</strong><small>Payment #{item.paymentId} · Booking #{item.bookingId}{!eventId && ` · ${item.eventName}`}</small></td>
          <td className={ui.amount}>{money(item.amount)}</td><td><RefundBadge status={item.status} /></td>
          <td><button onClick={() => setSelected(item.paymentId)}>Chi tiết</button></td>
        </tr>)}</tbody></table></div>}
      {data.totalPages > 1 ? <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} change={setPage} />
        : data.totalElements > 0 && <p className={ui.count}>{data.totalElements} khoản hoàn</p>}
    </>}
    {confirmBatch && <Dialog title="Xác nhận hoàn tiền hàng loạt" busy={busy} close={() => setConfirmBatch(false)}>
      <div className={ui.dialogBody}><p>Hoàn toàn bộ các giao dịch đủ điều kiện của sự kiện này.</p><p className={ui.muted}>Các khoản đã xử lý sẽ được bỏ qua.</p>
        {actionError && <p role="alert" className={ui.alert}>{actionError}</p>}
      </div><div className={ui.dialogActions}>
        <button disabled={busy} onClick={() => setConfirmBatch(false)}>Hủy</button>
        <button className={ui.primary} disabled={busy} onClick={batch}>{busy ? 'Đang gửi…' : 'Xác nhận hoàn hàng loạt'}</button>
      </div>
    </Dialog>}
    {selected !== null && <RefundEditor key={selected} paymentId={selected} close={() => { setSelected(null); reload() }} changed={reload} />}
  </section>
}

function RefundEditor({ paymentId, close, changed }: { paymentId: number; close: () => void; changed: () => void }) {
  const load = useCallback((signal: AbortSignal) => financeApi.refund(paymentId, signal), [paymentId])
  const { data, loading, error, reload } = useAdminData(load)
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(false)
  async function complete() {
    if (sending.current || loading || error || !data || data.status === 'COMPLETED') return
    sending.current = true; setBusy(true); setActionError(''); setNotice('')
    try {
      await financeApi.completeRefund(paymentId)
      setNotice('Hoàn tiền thành công.'); setConfirm(false)
    } catch (cause) { setActionError(errorMessage(cause)) }
    finally { sending.current = false; setBusy(false); reload(); changed() }
  }
  return <Dialog title={`Hoàn giao dịch #${paymentId}`} busy={busy} close={close}>
    <LoadState loading={loading} error={error} retry={reload} />
    {actionError && <p role="alert" className={ui.alert}>{actionError}</p>}
    {notice && <p role="status" className={ui.feedback}>{notice}</p>}
    {data && <div className={ui.dialogBody}>
      <div className={ui.detailTotal}><strong>{money(data.amount)}</strong><RefundBadge status={data.status} /></div>
      {data.status !== 'COMPLETED' && <>
        <button className={ui.primary} disabled={busy || loading} onClick={() => { setConfirm(true); setActionError('') }}>Hoàn tiền</button>
        {confirm && <div><p>Xác nhận hoàn toàn bộ giao dịch này?</p><div className={ui.dialogActions}>
          <button disabled={busy} onClick={() => setConfirm(false)}>Hủy</button>
          <button className={ui.primary} disabled={busy || loading} onClick={complete}>{busy ? 'Đang xử lý…' : 'Xác nhận hoàn tiền'}</button>
        </div></div>}
      </>}
      {data.reference && <p>Mã hoàn tiền: <strong>{data.reference}</strong><br /><span className={ui.muted}>{financeDate(data.refundedAt)}</span></p>}
      {data.processedBy && <p className={ui.muted}>Người xử lý: Admin #{data.processedBy}</p>}
      <div className={ui.dialogActions}><button disabled={busy} onClick={reload}>Cập nhật trạng thái</button><button disabled={busy} onClick={close}>Đóng</button></div>
    </div>}
  </Dialog>
}
