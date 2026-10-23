import { useCallback, useRef, useState } from 'react'
import { financeApi, financeDate, money } from '../api/admin-finance-api'
import { errorMessage } from '../api/admin-api'
import { useAdminData } from '../hooks/use-admin-data'
import { Dialog, LoadState, Pagination } from './AdminComponents'
import type { BankAccountInput } from '../types/refund'
import styles from '../pages/Admin.module.css'

const statusLabel = (status: string) => ({ WAITING: 'Chờ Admin xử lý', QUEUED: 'Đã xếp hàng hoàn', PROCESSING: 'Đang xử lý',
  RECONCILIATION: 'Cần đối soát', FAILED: 'Hoàn bị từ chối', MANUAL_PENDING: 'Đang hoàn thủ công', COMPLETED: 'Đã hoàn' } as Record<string, string>)[status] ?? status

export function RefundManagement({ eventId }: { eventId?: number }) {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmBatch, setConfirmBatch] = useState(false)
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const load = useCallback((signal: AbortSignal) => financeApi.refunds(eventId, page, signal), [eventId, page])
  const { data, loading, error, reload } = useAdminData(load)
  async function batch() {
    if (!eventId || sending.current) return
    sending.current = true; setBusy(true); setActionError('')
    try { const result = await financeApi.queueEventRefunds(eventId); setNotice(`Đã xếp hàng ${result.queuedCount} khoản hoàn. Theo dõi kết quả trước khi xử lý tiếp.`); setConfirmBatch(false); reload() }
    catch (cause) { setActionError(errorMessage(cause)); reload() }
    finally { sending.current = false; setBusy(false) }
  }
  return <section className={styles.panel}>
    <div className={styles.heading}><h2>{eventId ? 'Xử lý hoàn tiền' : 'Hoàn tiền từng giao dịch'}</h2><button onClick={reload}>Cập nhật trạng thái</button></div>
    <p>Chỉ hoàn toàn bộ giao dịch. Khoản đang xử lý hoặc cần đối soát không được chuyển sang hoàn thủ công.</p>
    {eventId && <button className={styles.primary} disabled={loading || busy || Boolean(error) || !data?.totalElements} onClick={() => { setActionError(''); setConfirmBatch(true) }}>Hoàn tiền hàng loạt</button>}
    {notice && <p role="status">{notice}</p>}
    <LoadState loading={loading} error={error} retry={reload} />
    {data && <>{data.items.length === 0 ? <p>Chưa có hồ sơ hoàn tiền.</p> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Giao dịch</th><th>Khách / Sự kiện</th><th>Số tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{data.items.map(item => <tr key={item.id}>
      <td>#{item.paymentId}<small>Booking #{item.bookingId}</small></td><td>{item.customerName}<small>{item.eventName}</small></td><td>{money(item.amount)}</td><td>{statusLabel(item.status)}</td><td><button onClick={() => setSelected(item.paymentId)}>Xem / Xử lý</button></td>
    </tr>)}</tbody></table></div>}<Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} change={setPage} /></>}
    {confirmBatch && <Dialog title="Xác nhận hoàn tiền hàng loạt" busy={busy} close={() => setConfirmBatch(false)}>
      <p>Xếp hàng các khoản VNPAY đang chờ của toàn bộ sự kiện này, bao gồm các trang khác. Tiền được hoàn về giao dịch thanh toán gốc.</p>
      {actionError && <p role="alert">{actionError}</p>}<button disabled={busy} onClick={batch}>{busy ? 'Đang gửi…' : 'Xác nhận hoàn hàng loạt'}</button>
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
  const [confirmAuto, setConfirmAuto] = useState(false)
  const [account, setAccount] = useState<BankAccountInput>({ bankCode: '', accountNumber: '', accountHolderName: '', originalAccountVerified: false })
  const [code, setCode] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  async function act(operation: () => Promise<unknown>, message: string) {
    if (sending.current || loading || error) return
    sending.current = true; setBusy(true); setActionError(''); setNotice('')
    try { await operation(); setNotice(message); setConfirmAuto(false) }
    catch (cause) { setActionError(errorMessage(cause)) }
    finally { sending.current = false; setBusy(false); reload(); changed() }
  }
  async function download() {
    try { const blob = await financeApi.refundEvidence(paymentId); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `refund-${paymentId}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
    catch (cause) { setActionError(errorMessage(cause)) }
  }
  const editable = data && ['WAITING', 'FAILED'].includes(data.status) && !loading && !busy && !error
  return <Dialog title={`Hoàn giao dịch #${paymentId}`} busy={busy} close={close}>
    <LoadState loading={loading} error={error} retry={reload} />
    {actionError && <p role="alert" className={styles.error}>{actionError}</p>}{notice && <p role="status">{notice}</p>}
    {data && <><p>{money(data.amount)} — {statusLabel(data.status)}</p><button disabled={busy} onClick={reload}>Đọc lại trạng thái</button>
      {data.status === 'WAITING' && <><button disabled={busy || loading} onClick={() => setConfirmAuto(true)}>Hoàn qua VNPAY</button>{confirmAuto && <div><p>Xác nhận hoàn toàn bộ giao dịch về nguồn thanh toán gốc?</p><button disabled={busy || loading} onClick={() => act(() => financeApi.queueRefund(paymentId), 'Đã xếp hàng hoàn tiền. Cập nhật trạng thái để xem kết quả.')}>Xác nhận hoàn</button><button onClick={() => setConfirmAuto(false)}>Bỏ qua</button></div>}</>}
      {data.status === 'RECONCILIATION' && <><p>Kết quả chưa rõ. Không chuyển khoản lần nữa.</p><button disabled={busy || loading} onClick={() => act(() => financeApi.reconcileRefund(paymentId), 'Đã truy vấn. Kiểm tra trạng thái được xác nhận bên dưới.')}>Truy vấn VNPAY</button></>}
      <h3>Tài khoản hoàn thủ công — chỉ Admin</h3>
      {editable && data.bankAccount && <p>Tài khoản đã lưu: {data.bankAccount.bankCode} — {data.bankAccount.accountNumber} — {data.bankAccount.accountHolderName}<br /><button onClick={() => setAccount({ ...data.bankAccount!, originalAccountVerified: false })}>Sửa tài khoản đã lưu</button></p>}
      {editable ? <form onSubmit={e => { e.preventDefault(); void act(() => financeApi.saveRefundAccount(paymentId, account), 'Đã lưu tài khoản đã xác minh.') }}>
        <label>Ngân hàng<input required maxLength={50} value={account.bankCode} onChange={e => setAccount({ ...account, bankCode: e.target.value })} /></label>
        <label>Số tài khoản<input required pattern="[0-9A-Za-z]{4,50}" maxLength={50} value={account.accountNumber} onChange={e => setAccount({ ...account, accountNumber: e.target.value })} /></label>
        <label>Chủ tài khoản<input required maxLength={255} value={account.accountHolderName} onChange={e => setAccount({ ...account, accountHolderName: e.target.value })} /></label>
        <label><input type="checkbox" required checked={account.originalAccountVerified} onChange={e => setAccount({ ...account, originalAccountVerified: e.target.checked })} />Đã xác minh đây là tài khoản dùng mua vé</label><button disabled={!account.originalAccountVerified}>Lưu tài khoản</button>
      </form> : data.bankAccount ? <p>{data.bankAccount.bankCode} — {data.bankAccount.accountNumber}<br />{data.bankAccount.accountHolderName}</p> : <p>Chưa có tài khoản đã xác minh.</p>}
      {editable && data.bankAccount && <><p>Giữ khoản hoàn thủ công trước khi chuyển tiền ngoài hệ thống. Thao tác này khóa hoàn tự động và thông tin tài khoản.</p><button onClick={() => act(() => financeApi.reserveManualRefund(paymentId), 'Đã giữ khoản hoàn thủ công. Chuyển đúng số tiền một lần rồi lưu chứng từ.')}>Chọn hoàn thủ công và khóa khoản hoàn</button></>}
      {data.status === 'MANUAL_PENDING' && <form onSubmit={e => { e.preventDefault(); if (evidence) void act(() => financeApi.confirmManualRefund(paymentId, code.trim(), evidence), 'Đã ghi nhận hoàn thủ công.') }}>
        <p>Chỉ xác nhận sau khi chuyển khoản thành công. Nếu mất phản hồi, đọc lại hồ sơ trước khi xử lý tiếp.</p>
        <label>Mã chuyển khoản<input required maxLength={255} value={code} onChange={e => setCode(e.target.value)} disabled={busy} /></label>
        <label>Chứng từ PDF/PNG/JPEG, tối đa 5 MB<input required type="file" accept="application/pdf,image/png,image/jpeg" disabled={busy} onChange={e => { const file = e.target.files?.[0] ?? null; setEvidence(file && file.size <= 5 * 1024 * 1024 ? file : null); setActionError(file && file.size > 5 * 1024 * 1024 ? 'Chứng từ tối đa 5 MB' : '') }} /></label>
        <button disabled={busy || loading || !code.trim() || !evidence}>Xác nhận đã chuyển khoản</button>
      </form>}
      {data.reference && <p>Mã giao dịch: {data.reference} — {financeDate(data.refundedAt)}</p>}
      {data.hasEvidence && <button onClick={download}>Tải chứng từ</button>}
      <h3>Lịch sử xử lý</h3>{data.attempts.length === 0 ? <p>Chưa gọi cổng thanh toán.</p> : data.attempts.map((attempt, i) => <p key={i}>{financeDate(attempt.createdAt)} — {attempt.command} — {statusLabel(attempt.outcome)} {attempt.responseCode && `(Mã ${attempt.responseCode})`}</p>)}
    </>}
  </Dialog>
}
