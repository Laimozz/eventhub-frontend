import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { financeApi, financeDate, money, withdrawalStatus } from '../api/admin-finance-api'
import { errorMessage } from '../api/admin-api'
import { useAdminData } from '../hooks/use-admin-data'
import { Dialog, LoadState } from '../components/AdminComponents'
import styles from './Admin.module.css'

export function WithdrawalDetailPage() {
  const { requestId } = useParams()
  return <WithdrawalDetail key={requestId} requestId={requestId} />
}

function WithdrawalDetail({ requestId }: { requestId: string | undefined }) {
  const id = Number(requestId)
  const load = useCallback((signal: AbortSignal) => financeApi.withdrawal(id, signal), [id])
  const { data, loading, error, reload } = useAdminData(load)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!action || sending.current || !value.trim() || value.trim().length > 255 || loading || data?.status !== 'PENDING' || data.payouts.length !== 0) return
    sending.current = true; setBusy(true); setActionError('')
    try {
      if (action === 'approve') await financeApi.approve(id, value.trim())
      else await financeApi.reject(id, value.trim())
      setNotice(action === 'approve' ? 'Đã ghi nhận chuyển khoản và duyệt yêu cầu.' : 'Đã từ chối và trả tiền về số dư khả dụng.')
      setAction(null); reload()
    } catch (cause) { setActionError(errorMessage(cause)); reload() }
    finally { sending.current = false; setBusy(false) }
  }
  function open(next: 'approve' | 'reject') { setAction(next); setValue(''); setActionError(''); setNotice('') }
  return <>
    <div className={styles.heading}><div><Link to="/admin/withdrawals">← Yêu cầu rút tiền</Link><h1>Yêu cầu #{requestId}</h1></div></div>
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    <LoadState loading={loading} error={error} retry={reload} />
    {data && <div className={styles.detailGrid}><section className={styles.panel}><h2>Thông tin yêu cầu</h2><dl>
      <dt>Nhà tổ chức</dt><dd>{data.organizer.fullName}<p>{data.organizer.email}</p></dd>
      <dt>Số tiền</dt><dd>{money(data.amount)}</dd><dt>Ngân hàng</dt><dd>{data.bankName}</dd><dt>Số tài khoản</dt><dd>{data.accountNumber}</dd>
      <dt>Trạng thái</dt><dd>{withdrawalStatus(data.status)}</dd><dt>Ngày yêu cầu</dt><dd>{financeDate(data.requestedAt)}</dd>
      <dt>Admin xử lý</dt><dd>{data.processedBy ?? '—'}</dd><dt>Ngày xử lý</dt><dd>{financeDate(data.processedAt)}</dd>
      <dt>Mã giao dịch</dt><dd>{data.transactionCode ?? '—'}</dd><dt>Lý do từ chối</dt><dd className={styles.description}>{data.rejectReason ?? '—'}</dd>
    </dl><h2>Lịch sử chi trả</h2>{data.payouts.length === 0 ? <p>Chưa có giao dịch chi trả.</p> : data.payouts.map(p => <article key={p.id}><p>{money(p.amount)} • {p.status}</p><p>{p.transactionCode} • {financeDate(p.completedAt)}</p>{p.failureReason && <p>{p.failureReason}</p>}</article>)}</section>
    <aside className={styles.panel}><h2>Xử lý yêu cầu</h2>{data.status === 'PENDING' && data.payouts.length === 0 ? <><p>Chỉ duyệt sau khi đã chuyển khoản ngoài hệ thống và có mã giao dịch từ ngân hàng.</p><div className={styles.actions}><button className={styles.primary} onClick={() => open('approve')}>Duyệt</button><button className={styles.danger} onClick={() => open('reject')}>Từ chối</button></div></> : <p>{data.status === 'PENDING' ? 'Yêu cầu đã có giao dịch chi trả, cần đối soát trước khi xử lý.' : 'Yêu cầu đã được xử lý.'}</p>}</aside></div>}
    {action && <Dialog title={action === 'approve' ? 'Xác nhận ghi nhận chuyển khoản' : 'Xác nhận từ chối'} busy={busy} close={() => setAction(null)}><form onSubmit={submit}>
      <p>{action === 'approve' ? 'Xác nhận bạn đã chuyển khoản cho Nhà tổ chức. Hệ thống ghi nhận mã giao dịch và cập nhật số dư chờ rút.' : 'Khoản tiền chờ rút sẽ được trả về số dư khả dụng của Nhà tổ chức.'}</p>
      <label>{action === 'approve' ? 'Mã giao dịch chuyển tiền' : 'Lý do từ chối'}<textarea required maxLength={255} value={value} disabled={busy} onChange={e => setValue(e.target.value)} /></label>
      {actionError && <p role="alert" className={styles.error}>{actionError}</p>}
      <div className={styles.actions}><button type="button" disabled={busy} onClick={() => setAction(null)}>Hủy bỏ</button><button className={styles.primary} disabled={busy || !value.trim() || loading || !data || data.status !== 'PENDING' || data.payouts.length !== 0}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</button></div>
    </form></Dialog>}
  </>
}
