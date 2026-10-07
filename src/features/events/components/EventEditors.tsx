import { useState } from 'react'
import { Check, UserRound } from 'lucide-react'
import type { EventDraft, FieldErrors, GuestDraft, TicketDraft } from '../types/event'
import { validateGuest, validateTicket } from '../event-form'
import { EditorDialog, Field, ImageField } from './EventFields'
import styles from '../pages/CreateEventPage.module.css'

export function GuestEditor({ initial, onClose, onSave }: { initial: GuestDraft; onClose: () => void; onSave: (guest: GuestDraft) => void }) {
  const [guest, setGuest] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const change = (field: keyof GuestDraft, value: string | File | null) => { setGuest(previous => ({ ...previous, [field]: value })); setErrors(previous => ({ ...previous, [field]: '' })) }
  return <EditorDialog title="Thêm khách mời / nghệ sĩ" subtitle="Điền thông tin người sẽ đồng hành cùng sự kiện của bạn." onClose={onClose} busy={false}>
    <form onSubmit={event => { event.preventDefault(); const next = validateGuest(guest); setErrors(next); if (!Object.keys(next).length) onSave(guest) }} noValidate>
      <div className={styles.dialogBody}><div className={styles.editorIntro}><UserRound size={27} /><div><strong>Khách mời, diễn giả & nghệ sĩ</strong><p>Thông tin sẽ xuất hiện trong hồ sơ gửi duyệt.</p></div></div>
        <Field id="guest-name" label="Tên khách mời / Nghệ sĩ" required error={errors.name}><input id="guest-name" value={guest.name} maxLength={50} autoFocus onChange={event => change('name', event.target.value)} placeholder="Ví dụ: Nguyễn Văn A" /></Field>
        <Field id="guest-role" label="Vai trò / Danh hiệu" required error={errors.role}><input id="guest-role" list="guest-roles" value={guest.role} maxLength={50} onChange={event => change('role', event.target.value)} placeholder="Ví dụ: Ca sĩ chính, Diễn giả, MC…" /><datalist id="guest-roles">{['Ca sĩ chính', 'Diễn giả', 'MC', 'DJ', 'Khách mời'].map(role => <option key={role} value={role} />)}</datalist></Field>
        <Field id="guest-description" label="Mô tả / Giới thiệu ngắn" error={errors.description}><textarea id="guest-description" value={guest.description} maxLength={255} onChange={event => change('description', event.target.value)} rows={3} placeholder="Giới thiệu về khách mời…" /></Field>
        <ImageField id="guest-image" label="Ảnh khách mời" value={guest.imageFile} existingUrl={guest.imageUrl} onChange={file => { change('imageFile', file); setGuest(previous => ({ ...previous, imageUrl: file ? previous.imageUrl : null, removeImage: !file })) }} compact error={errors.imageFile} />
      </div><div className={styles.dialogFooter}><button type="button" className={styles.secondary} onClick={onClose}>Hủy bỏ</button><button className={styles.primary}><Check size={17} /> Lưu khách mời</button></div>
    </form>
  </EditorDialog>
}

export function TicketEditor({ initial, draft, onClose, onSave }: { initial: TicketDraft; draft: EventDraft; onClose: () => void; onSave: (ticket: TicketDraft) => void }) {
  const [ticket, setTicket] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const change = (field: keyof TicketDraft, value: string | File | null) => { setTicket(previous => ({ ...previous, [field]: value })); setErrors(previous => ({ ...previous, [field]: '' })) }
  return <EditorDialog title="Thiết lập loại vé" subtitle="Cấu hình số lượng, giá và thời gian mở bán cho loại vé này." onClose={onClose} busy={false}>
    <form onSubmit={event => { event.preventDefault(); const next = validateTicket(ticket, draft); setErrors(next); if (!Object.keys(next).length) onSave(ticket) }} noValidate>
      <div className={styles.dialogBody}>
        <Field id="ticket-name" label="Tên loại vé" required error={errors.name}><input id="ticket-name" value={ticket.name} maxLength={255} autoFocus onChange={event => change('name', event.target.value)} placeholder="Ví dụ: Vé VIP, Vé tiêu chuẩn…" /></Field>
        <div className={styles.twoColumns}><Field id="ticket-price" label="Giá vé (VNĐ)" required error={errors.price} hint="Nhập 0 nếu vé miễn phí."><input id="ticket-price" inputMode="decimal" value={ticket.price} onChange={event => change('price', event.target.value)} placeholder="150000" /></Field><Field id="ticket-quantity" label="Số lượng phát hành" required error={errors.quantity}><input id="ticket-quantity" type="number" min="1" max="2147483647" value={ticket.quantity} onChange={event => change('quantity', event.target.value)} placeholder="100" /></Field></div>
        <div className={styles.twoColumns}><Field id="ticket-sale-start" label="Bắt đầu bán vé" required error={errors.saleStartTime}><input id="ticket-sale-start" type="datetime-local" value={ticket.saleStartTime} onChange={event => change('saleStartTime', event.target.value)} /></Field><Field id="ticket-sale-end" label="Kết thúc bán vé" required error={errors.saleEndTime}><input id="ticket-sale-end" type="datetime-local" value={ticket.saleEndTime} onChange={event => change('saleEndTime', event.target.value)} /></Field></div>
        <p className={styles.infoNote}>Giờ Việt Nam (GMT+7). Thời gian bán vé phải kết thúc trước khi sự kiện bắt đầu.</p>
        <Field id="ticket-description" label="Mô tả / Quyền lợi" error={errors.description}><textarea id="ticket-description" value={ticket.description} maxLength={255} onChange={event => change('description', event.target.value)} rows={3} placeholder="Quyền lợi, khu vực, lưu ý của loại vé…" /></Field>
        <ImageField id="ticket-image" label="Ảnh loại vé" value={ticket.imageFile} existingUrl={ticket.imageUrl} onChange={file => { change('imageFile', file); if (!file) setTicket(previous => ({ ...previous, imageUrl: null })) }} required compact error={errors.imageFile} />
      </div><div className={styles.dialogFooter}><button type="button" className={styles.secondary} onClick={onClose}>Hủy bỏ</button><button className={styles.primary}><Check size={17} /> Lưu loại vé</button></div>
    </form>
  </EditorDialog>
}
