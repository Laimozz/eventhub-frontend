import { useRef, useState } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { cancelEvent } from '../api/event-api'
import { eventError } from '../event-form'
import type { EventDetail } from '../types/event'
import { EditorDialog, Field } from './EventFields'
import styles from '../pages/CreateEventPage.module.css'

export function CancelEventDialog({ event, onClose, onCanceled }: {
  event: { id: number; name: string }; onClose: () => void; onCanceled: (event: EventDetail) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const sending = useRef(false)
  async function submit() {
    if (sending.current) return
    if (!reason.trim() || reason.length > 255) { setError('Vui lòng nhập lý do hủy, tối đa 255 ký tự.'); return }
    sending.current = true; setPending(true); setError('')
    try { onCanceled(await cancelEvent(event.id, reason)) }
    catch (cause) { setError(eventError(cause)) }
    finally { sending.current = false; setPending(false) }
  }
  return <EditorDialog title="Xác nhận hủy sự kiện" subtitle={event.name} onClose={onClose} busy={pending}>
    <form onSubmit={e => { e.preventDefault(); void submit() }}>
      <div className={styles.dialogBody}><p className={styles.infoNote}><ShieldCheck size={17} />Sự kiện sẽ được hủy ngay và dừng bán vé. Admin sẽ xử lý hoàn tiền cho các giao dịch đã thanh toán. Chỉ được hủy trước giờ bắt đầu.</p>
        <Field id="cancel-reason" label="Lý do hủy" required><textarea id="cancel-reason" rows={4} maxLength={255} value={reason} autoFocus disabled={pending} onChange={e => { setReason(e.target.value); setError('') }} placeholder="Nhập lý do cần hủy sự kiện…" /></Field>
        {error && <p role="alert" className={styles.errorBanner}>{error}</p>}
      </div><div className={styles.dialogFooter}><button type="button" className={styles.secondary} onClick={onClose} disabled={pending}>Giữ sự kiện</button><button className={styles.primary} disabled={pending}>{pending && <LoaderCircle className={styles.spin} size={16} />}{pending ? 'Đang gửi…' : 'Xác nhận hủy'}</button></div>
    </form>
  </EditorDialog>
}
