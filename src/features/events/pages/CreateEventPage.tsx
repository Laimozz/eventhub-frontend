import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight, Circle, CirclePlus, Copy, Eye, FileCheck2, LoaderCircle, MapPin, Pencil, Save, ShieldCheck, Ticket, Trash2, UserRound, Users } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { createEvent, getCategories } from '../api/event-api'
import { EditorDialog, Field, ImageField, ImagePreview } from '../components/EventFields'
import { GuestEditor, TicketEditor } from '../components/EventEditors'
import { emptyDraft, emptyGuest, emptyTicket, eventError, formatDate, loadDraft, money, positiveInteger, validateDetails, validateGuest, validateTicket } from '../event-form'
import type { Category, CreatedEvent, EventDraft, FieldErrors, GuestDraft, TicketDraft } from '../types/event'
import styles from './CreateEventPage.module.css'

const steps = [
  { path: 'details', title: 'Thông tin sự kiện', note: 'Tên, địa điểm, thời gian & ảnh' },
  { path: 'category', title: 'Danh mục & Khách mời', note: 'Thể loại, nghệ sĩ & diễn giả' },
  { path: 'tickets', title: 'Loại vé & Gửi duyệt', note: 'Giá vé, số lượng & hồ sơ' },
]

export function CreateEventPage() {
  const { user } = useAuth()
  const { step: routeStep } = useParams()
  const navigate = useNavigate()
  const step = Math.max(0, steps.findIndex(item => item.path === routeStep))
  const draftKey = `eventhub:event-draft:${user?.id}`
  const [draft, setDraft] = useState<EventDraft>(() => loadDraft(draftKey))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [categoryError, setCategoryError] = useState('')
  const [reload, setReload] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const sending = useRef(false)
  const [guestEditor, setGuestEditor] = useState<GuestDraft | null>(null)
  const [ticketEditor, setTicketEditor] = useState<TicketDraft | null>(null)
  const [preview, setPreview] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [created, setCreated] = useState<CreatedEvent | null>(null)
  const category = categories.find(item => String(item.id) === draft.categoryId)
  const totalTickets = draft.ticketTypes.reduce((sum, item) => sum + Number(item.quantity), 0)
  const revenue = draft.ticketTypes.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0)

  useEffect(() => {
    if (created) return
    try { sessionStorage.setItem(draftKey, JSON.stringify(draft, (_key, value) => value instanceof File ? null : value)) } catch { /* The form still works when browser storage is unavailable. */ }
  }, [draft, draftKey, created])

  useEffect(() => {
    const controller = new AbortController()
    getCategories(controller.signal).then(items => { if (!controller.signal.aborted) setCategories(items) })
      .catch(cause => { if (!controller.signal.aborted) setCategoryError(eventError(cause)) })
      .finally(() => { if (!controller.signal.aborted) setCategoryLoading(false) })
    return () => controller.abort()
  }, [reload])

  useEffect(() => {
    if (created) return
    if (!steps.some(item => item.path === routeStep) || (step > 0 && Object.keys(validateDetails(draft)).length)) navigate('/organizer/events/new/details', { replace: true })
    else if (step === 2 && !positiveInteger(draft.categoryId)) navigate('/organizer/events/new/category', { replace: true })
  }, [routeStep, step, draft, navigate, created])

  function change(field: keyof EventDraft, value: string | File | null) {
    setDraft(previous => ({ ...previous, [field]: value }))
    setErrors(previous => ({ ...previous, [field]: '' })); setError(''); setMessage('')
  }
  function saveDraft() {
    try { sessionStorage.setItem(draftKey, JSON.stringify(draft, (_key, value) => value instanceof File ? null : value)); setMessage('Đã lưu thông tin bản nháp. Sau khi tải lại trang, bạn cần chọn lại các ảnh.'); setError('') }
    catch { setError('Trình duyệt không cho phép lưu bản nháp. Bạn vẫn có thể tiếp tục và gửi duyệt.') }
  }
  function go(next: number) {
    setErrors({}); setError(''); setMessage('')
    navigate(`/organizer/events/new/${steps[next].path}`)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function next() {
    const nextErrors = step === 0 ? validateDetails(draft) : !category ? { categoryId: 'Vui lòng chọn một danh mục hiện có.' } : {}
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { setError('Vui lòng kiểm tra các thông tin được đánh dấu trước khi tiếp tục.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    go(step + 1)
  }
  async function submit() {
    if (sending.current || guestEditor || ticketEditor || categoryLoading) return
    if (Object.keys(validateDetails(draft)).length) { go(0); setErrors(validateDetails(draft)); setError('Vui lòng kiểm tra lại thông tin sự kiện.'); return }
    if (!category) { go(1); setErrors({ categoryId: 'Vui lòng chọn lại danh mục sự kiện.' }); return }
    if (draft.guests.some(item => Object.keys(validateGuest(item)).length)) { go(1); setError('Vui lòng kiểm tra lại thông tin khách mời.'); return }
    if (!draft.ticketTypes.length) { setError('Vui lòng thêm ít nhất một loại vé trước khi gửi duyệt.'); return }
    if (draft.ticketTypes.some(item => Object.keys(validateTicket(item, draft)).length)) { setError('Có loại vé chưa hợp lệ. Hãy kiểm tra lại thời gian bán vé và thông tin từng loại vé.'); return }
    if (totalTickets > Number(draft.capacity)) { setError('Tổng số lượng vé không được vượt quá sức chứa địa điểm.'); return }
    sending.current = true; setPending(true); setError('')
    try { const result = await createEvent(draft); setCreated(result); sessionStorage.removeItem(draftKey); window.scrollTo({ top: 0, behavior: 'instant' }) }
    catch (cause) { setError(eventError(cause)) }
    finally { sending.current = false; setPending(false) }
  }
  function saveGuest(guest: GuestDraft) {
    setDraft(previous => ({ ...previous, guests: previous.guests.some(item => item.key === guest.key) ? previous.guests.map(item => item.key === guest.key ? guest : item) : [...previous.guests, guest] }))
    setGuestEditor(null)
  }
  function saveTicket(ticket: TicketDraft) {
    setDraft(previous => ({ ...previous, ticketTypes: previous.ticketTypes.some(item => item.key === ticket.key) ? previous.ticketTypes.map(item => item.key === ticket.key ? ticket : item) : [...previous.ticketTypes, ticket] }))
    setTicketEditor(null); setError('')
  }
  const detailInput = (field: keyof EventDraft) => ({ 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `${field}-error` : undefined })
  const completedDetails = !Object.keys(validateDetails(draft)).length

  if (created) return <section className={styles.success}><CheckCircle2 size={58} /><h1>Đã gửi sự kiện chờ duyệt!</h1><p><strong>{created.name}</strong> đã được tạo thành công.<br />Mã sự kiện: <strong>#{created.id}</strong> · Trạng thái: <strong>Chờ duyệt</strong><br />Admin sẽ xem xét hồ sơ của bạn trước khi sự kiện được mở bán.</p><div><Link className={styles.secondary} to="/organizer">Về tổng quan</Link><button className={styles.primary} onClick={() => { setCreated(null); setDraft({ ...emptyDraft }); go(0) }}><CirclePlus size={17} />Tạo sự kiện khác</button></div></section>

  return <div className={styles.page}>
    <div className={styles.breadcrumb}><Link to="/organizer">Tổng quan</Link><ChevronRight size={12} /><span>Tạo sự kiện mới</span><ChevronRight size={12} /><span>Bước {step + 1}</span></div>
    <div className={styles.heading}><div><div className={styles.titleLine}><h1>Tạo sự kiện mới</h1><span>BẢN NHÁP TRÊN THIẾT BỊ</span></div><p>Hoàn tất 3 bước thiết lập để gửi hồ sơ sự kiện cho Admin xét duyệt.</p></div><div className={styles.headingActions}><button className={styles.secondary} onClick={saveDraft} disabled={pending}><Save size={15} />Lưu bản nháp</button><button className={styles.secondary} onClick={() => setPreview(true)} disabled={pending}><Eye size={16} />Xem trước</button></div></div>
    <nav className={styles.steps} aria-label="Các bước tạo sự kiện">{steps.map((item, index) => <button key={item.path} className={`${styles.step} ${index === step ? styles.stepCurrent : index < step ? styles.stepDone : ''}`} disabled={index > step || pending} aria-current={index === step ? 'step' : undefined} onClick={() => go(index)}><span className={styles.stepNumber}>{index < step ? <Check size={16} /> : index + 1}</span><div><small>BƯỚC {index + 1} · {index === step ? 'Đang thực hiện' : index < step ? 'Đã hoàn thành' : 'Chưa thực hiện'}</small><strong>{item.title}</strong></div></button>)}</nav>
    {message && <p className={styles.notice} role="status">{message}</p>}{error && <p className={styles.errorBanner} role="alert">{error}</p>}
    <div className={styles.body}><div className={styles.mainColumn}>
      {step === 0 && <>
        <section className={styles.card}><h2><span className={styles.sectionNumber}>01</span>Thông tin chung sự kiện</h2>
          <Field id="name" label="Tên sự kiện" required error={errors.name} hint={`${draft.name.length}/255 ký tự`}><input id="name" value={draft.name} maxLength={255} placeholder="Ví dụ: Đêm nhạc Acoustic Thu" onChange={event => change('name', event.target.value)} {...detailInput('name')} /></Field>
          <Field id="description" label="Mô tả sự kiện" error={errors.description} hint={`${draft.description.length}/255 ký tự`}><textarea id="description" value={draft.description} maxLength={255} rows={4} placeholder="Giới thiệu ngắn về sự kiện và trải nghiệm dành cho khán giả…" onChange={event => change('description', event.target.value)} /></Field>
        </section>
        <section className={styles.card}><h2><span className={styles.sectionNumber}>02</span>Địa điểm & Sức chứa</h2><div className={styles.twoColumns}>
          <Field id="city" label="Tỉnh / Thành phố" required error={errors.city}><input id="city" list="event-cities" value={draft.city} maxLength={255} placeholder="Chọn hoặc nhập thành phố" onChange={event => change('city', event.target.value)} {...detailInput('city')} /><datalist id="event-cities">{['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Huế', 'Cần Thơ'].map(city => <option key={city} value={city} />)}</datalist></Field>
          <Field id="capacity" label="Sức chứa dự kiến (người)" required error={errors.capacity}><input id="capacity" type="number" value={draft.capacity} min="1" max="2147483647" placeholder="500" onChange={event => change('capacity', event.target.value)} {...detailInput('capacity')} /></Field></div>
          <Field id="address" label="Địa chỉ chi tiết / Địa điểm" required error={errors.address}><input id="address" value={draft.address} maxLength={255} placeholder="Số nhà, đường, phường/xã, tên địa điểm…" onChange={event => change('address', event.target.value)} {...detailInput('address')} /></Field>
          <p className={styles.infoNote}>Địa điểm này sẽ được lưu cùng sự kiện. Tổng số vé phát hành không được vượt quá sức chứa.</p>
        </section>
        <section className={styles.card}><h2><span className={styles.sectionNumber}>03</span>Thời gian tổ chức</h2><div className={styles.twoColumns}>
          <Field id="startTime" label="Thời gian bắt đầu" required error={errors.startTime}><input id="startTime" type="datetime-local" value={draft.startTime} onChange={event => change('startTime', event.target.value)} {...detailInput('startTime')} /></Field>
          <Field id="endTime" label="Thời gian kết thúc" required error={errors.endTime}><input id="endTime" type="datetime-local" value={draft.endTime} onChange={event => change('endTime', event.target.value)} {...detailInput('endTime')} /></Field></div><p className={styles.infoNote}>Giờ Việt Nam (GMT+7). Thời gian bắt đầu phải ở tương lai; kết thúc sau bắt đầu.</p>
        </section>
      </>}
      {step === 1 && <>
        <section className={styles.card}><h2><span className={styles.sectionNumber}>01</span>Danh mục sự kiện</h2><Field id="categoryId" label="Thể loại sự kiện" required error={errors.categoryId}><select id="categoryId" value={draft.categoryId} onChange={event => change('categoryId', event.target.value)} disabled={categoryLoading} aria-invalid={Boolean(errors.categoryId)}><option value="">{categoryLoading ? 'Đang tải danh mục…' : '-- Chọn danh mục --'}</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          {categoryError && <div className={styles.errorBanner} role="alert">{categoryError}<button className={styles.textButton} onClick={() => { setCategoryLoading(true); setCategoryError(''); setReload(value => value + 1) }}>Tải lại danh mục</button></div>}
          {!categoryLoading && !categoryError && !categories.length && <p className={styles.infoNote}>Chưa có danh mục. Vui lòng liên hệ Admin thêm danh mục trước khi tạo sự kiện.</p>}
          {category?.description && <p className={styles.infoNote}>{category.description}</p>}
        </section>
        <section className={styles.card}><div className={styles.sectionHeader}><div><h2><Users size={18} />Khách mời, diễn giả & Nghệ sĩ</h2><p>Thêm những người đồng hành cùng sự kiện (không bắt buộc).</p></div><button className={styles.primary} onClick={() => setGuestEditor(emptyGuest())}><CirclePlus size={16} />Thêm khách mời</button></div>
          {!draft.guests.length ? <div className={styles.emptyState}><Users size={32} /><h3>Chưa có khách mời</h3><p>Bạn có thể thêm nghệ sĩ, diễn giả, MC hoặc tiếp tục với sự kiện không có khách mời.</p></div> : <div className={styles.guestList}>{draft.guests.map(guest => <article key={guest.key} className={styles.guestCard}>{guest.imageFile ? <ImagePreview className={styles.guestAvatar} file={guest.imageFile} alt={guest.name} /> : <div className={styles.guestAvatar}><UserRound size={22} /></div>}<div className={styles.guestInfo}><strong>{guest.name}</strong><span>{guest.role}</span>{guest.description && <p>{guest.description}</p>}</div><div className={styles.cardActions}><button aria-label={`Sửa khách mời ${guest.name}`} onClick={() => setGuestEditor(guest)}><Pencil size={14} /></button><button aria-label={`Xóa khách mời ${guest.name}`} onClick={() => setDraft(previous => ({ ...previous, guests: previous.guests.filter(item => item.key !== guest.key) }))}><Trash2 size={14} /></button></div></article>)}</div>}
        </section>
      </>}
      {step === 2 && <>
        <section className={styles.card}><div className={styles.sectionHeader}><div><h2><Ticket size={19} />Danh sách loại vé phát hành</h2><p>Tổng: <strong>{totalTickets.toLocaleString('vi-VN')} vé</strong> · {draft.ticketTypes.length} loại vé</p></div><button className={styles.primary} onClick={() => setTicketEditor(emptyTicket())} disabled={pending}><CirclePlus size={16} />Thêm loại vé mới</button></div>
          {!draft.ticketTypes.length ? <div className={styles.emptyState}><Ticket size={35} /><h3>Thiết lập loại vé đầu tiên</h3><p>Thêm tên vé, giá, số lượng, ảnh và thời gian bán.<br />Bạn cần ít nhất một loại vé để gửi duyệt.</p><button className={styles.primary} onClick={() => setTicketEditor(emptyTicket())}><CirclePlus size={16} />Thêm loại vé</button></div> : <div className={styles.ticketList}>{draft.ticketTypes.map(ticket => <article className={styles.ticketCard} key={ticket.key}><div className={styles.ticketTop}><ImagePreview file={ticket.imageFile} alt={`Ảnh ${ticket.name}`} /><div className={styles.ticketInfo}><h3>{ticket.name}</h3><span>Chờ duyệt · Chưa mở bán</span></div><div className={styles.ticketPrice}><strong>{money(ticket.price)}</strong><small>{Number(ticket.quantity).toLocaleString('vi-VN')} vé phát hành</small></div></div><div className={styles.ticketDetails}>{ticket.description && <p>{ticket.description}</p>}<p><CalendarDays size={12} /> {formatDate(ticket.saleStartTime)} → {formatDate(ticket.saleEndTime)}</p></div><div className={styles.cardActions}><button disabled={pending} onClick={() => setTicketEditor(ticket)}><Pencil size={13} />Sửa</button><button disabled={pending} onClick={() => setDraft(previous => ({ ...previous, ticketTypes: [...previous.ticketTypes, { ...ticket, key: crypto.randomUUID(), name: `${ticket.name.slice(0, 244)} (bản sao)` }] }))}><Copy size={13} />Nhân bản</button><button disabled={pending} onClick={() => setDraft(previous => ({ ...previous, ticketTypes: previous.ticketTypes.filter(item => item.key !== ticket.key) }))}><Trash2 size={13} />Xóa</button></div></article>)}</div>}
        </section>
        <section className={styles.card}><h2><FileCheck2 size={19} />Thông tin gửi xét duyệt</h2><div className={styles.summary}><div><span>Sự kiện</span><strong>{draft.name}</strong></div><div><span>Danh mục</span><strong>{category?.name || 'Đang tải…'}</strong></div><div><span>Địa điểm</span><strong>{draft.address}, {draft.city}</strong></div><div><span>Thời gian</span><strong>{formatDate(draft.startTime)}<br />{formatDate(draft.endTime)}</strong></div><div><span>Khách mời</span><strong>{draft.guests.length} người</strong></div></div><p className={styles.infoNote}>Thông tin sự kiện, địa điểm, loại vé và khách mời sẽ được gửi cùng một hồ sơ khi bạn bấm gửi duyệt.</p></section>
      </>}
    </div><aside className={styles.sideColumn}>
      {step === 0 && <section className={styles.card}><h2><span className={styles.sectionNumber}>04</span>Hình ảnh sự kiện</h2>{([{ field: 'bannerImage', label: 'Ảnh bìa / Poster', required: true }, { field: 'thumbnailImage', label: 'Ảnh thumbnail', required: true }, { field: 'imageZone', label: 'Sơ đồ khu vực / Chỗ ngồi', required: false }] as const).map(item => <ImageField key={item.field} id={item.field} label={item.label} required={item.required} value={draft[item.field]} error={errors[item.field]} onChange={url => change(item.field, url)} />)}<p className={styles.infoNote}>Chọn ảnh thuộc quyền sử dụng của ban tổ chức. Ảnh bìa nên có tỷ lệ ngang 16:9. Ảnh chỉ được tải lên khi bạn gửi tạo sự kiện.</p></section>}
      {step === 2 && <section className={styles.card}><h2>Tóm tắt phát hành</h2><div className={styles.summary}><div><span>Sức chứa địa điểm</span><strong>{Number(draft.capacity).toLocaleString('vi-VN')} người</strong></div><div><span>Tổng số vé cấu hình</span><strong style={{ color: totalTickets > Number(draft.capacity) ? '#b42318' : '#087e4b' }}>{totalTickets.toLocaleString('vi-VN')} vé</strong></div><div><span>Số loại vé</span><strong>{draft.ticketTypes.length}</strong></div></div><div className={styles.summaryTotal}><span>DOANH THU VÉ DỰ KIẾN</span><strong>{money(revenue)}</strong><small>Ước tính nếu bán hết số vé đã cấu hình.</small></div>{totalTickets > Number(draft.capacity) && <p className={styles.fieldError}>Tổng số vé vượt sức chứa. Hãy giảm số lượng vé.</p>}</section>}
      <section className={styles.card}><h2><ShieldCheck size={18} />Hồ sơ gửi duyệt</h2><div className={styles.checklist}>{[{ text: 'Tên, địa điểm & thời gian hợp lệ', done: completedDetails }, { text: 'Ảnh bìa & thumbnail đã có', done: Boolean(draft.bannerImage && draft.thumbnailImage) }, { text: 'Danh mục sự kiện đã chọn', done: Boolean(category) }, { text: `${draft.guests.length} khách mời đã thiết lập (tùy chọn)`, done: true }, { text: 'Loại vé hợp lệ & trong sức chứa', done: Boolean(draft.ticketTypes.length && totalTickets <= Number(draft.capacity) && draft.ticketTypes.every(item => !Object.keys(validateTicket(item, draft)).length)) }].map(item => <div className={item.done ? styles.checked : ''} key={item.text}>{item.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}<span>{item.text}</span></div>)}</div></section>
      <div className={styles.blueNote}><strong>Quy trình xét duyệt EventHub</strong>Hồ sơ sau khi gửi sẽ ở trạng thái <b>Chờ duyệt</b>. Admin sẽ xem xét thông tin trước khi sự kiện được mở bán.</div>
    </aside></div>
    <footer className={styles.footer}><div><button className={styles.textButton} onClick={() => setCancel(true)} disabled={pending}>Hủy bỏ thay đổi</button><button className={styles.secondary} onClick={saveDraft} disabled={pending}><Save size={15} />Lưu bản nháp</button></div><div><button className={styles.secondary} onClick={() => go(step - 1)} disabled={step === 0 || pending}><ArrowLeft size={16} />Quay lại</button>{step < 2 ? <button className={styles.primary} disabled={categoryLoading && step === 1 || Boolean(categoryError) && step === 1} onClick={next}>Tiếp tục: Bước {step + 2}<ArrowRight size={16} /></button> : <button className={styles.primary} onClick={() => void submit()} disabled={pending || categoryLoading || Boolean(categoryError)}>{pending ? <LoaderCircle className={styles.spin} size={17} /> : <FileCheck2 size={17} />}{pending ? 'Đang gửi hồ sơ…' : 'Gửi Admin xét duyệt'}</button>}</div></footer>
    {guestEditor && <GuestEditor initial={guestEditor} onClose={() => setGuestEditor(null)} onSave={saveGuest} />}
    {ticketEditor && <TicketEditor initial={ticketEditor} draft={draft} onClose={() => setTicketEditor(null)} onSave={saveTicket} />}
    {cancel && <EditorDialog title="Hủy tạo sự kiện?" subtitle="Bản nháp của sự kiện này sẽ bị xóa khỏi trình duyệt." onClose={() => setCancel(false)} busy={false}><div className={styles.dialogFooter}><button className={styles.secondary} onClick={() => setCancel(false)}>Tiếp tục chỉnh sửa</button><button className={styles.primary} onClick={() => { sessionStorage.removeItem(draftKey); navigate('/organizer') }}>Hủy và về tổng quan</button></div></EditorDialog>}
    {preview && <EditorDialog title="Xem trước sự kiện" subtitle="Kiểm tra thông tin trước khi gửi hồ sơ cho Admin." onClose={() => setPreview(false)} busy={false}><div className={styles.dialogBody}>{draft.bannerImage && <ImagePreview className={styles.previewPoster} file={draft.bannerImage} alt="Ảnh bìa sự kiện" />}<h2 className={styles.previewTitle}>{draft.name || 'Tên sự kiện của bạn'}</h2><p className={styles.previewText}>{draft.description || 'Chưa có mô tả.'}</p><div className={styles.previewDetails}><p><CalendarDays size={16} />{formatDate(draft.startTime)} → {formatDate(draft.endTime)}</p><p><MapPin size={16} />{draft.address || 'Chưa có địa chỉ'}{draft.city && `, ${draft.city}`}</p><p><Ticket size={16} />{category?.name || 'Chưa chọn danh mục'} · {draft.ticketTypes.length} loại vé</p></div>{draft.guests.length > 0 && <p className={styles.previewText}>Khách mời: {draft.guests.map(item => `${item.name} (${item.role})`).join(', ')}</p>}{draft.ticketTypes.map(item => <div key={item.key} className={styles.infoNote}><strong>{item.name}</strong> · {money(item.price)} · {item.quantity} vé</div>)}</div></EditorDialog>}
  </div>
}
