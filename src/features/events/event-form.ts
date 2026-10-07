import { ApiError } from '../../lib/http-client'
import type { CreateEventRequest, EventDraft, FieldErrors, GuestDraft, TicketDraft } from './types/event'

export const emptyDraft: EventDraft = {
  name: '', description: '', city: '', address: '', capacity: '', thumbnailImage: null, bannerImage: null,
  imageZone: null, startTime: '', endTime: '', categoryId: '', guests: [], ticketTypes: [],
}
export const emptyGuest = (): GuestDraft => ({ key: crypto.randomUUID(), name: '', role: '', description: '', imageFile: null })
export const emptyTicket = (): TicketDraft => ({ key: crypto.randomUUID(), name: '', description: '', imageFile: null, price: '', quantity: '', saleStartTime: '', saleEndTime: '' })

// The form explicitly uses Vietnam time, independently of the browser's time zone.
export function toUtc(value: string) { return new Date(`${value}+07:00`).toISOString().slice(0, 19) }
export function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(`${value}+07:00`)) : 'Chưa thiết lập'
}
export function money(value: number | string) { return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(value) || 0) + ' ₫' }
export function positiveInteger(value: string) { return /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 2147483647 }
function text(errors: FieldErrors, field: string, value: string, max: number, required = false) {
  if (required && !value.trim()) errors[field] = 'Vui lòng điền thông tin này.'
  else if (value.length > max) errors[field] = `Tối đa ${max} ký tự.`
}
function image(errors: FieldErrors, field: string, value: File | null, required = false) {
  if (!value && !required) return
  if (!value) { errors[field] = 'Vui lòng chọn ảnh.'; return }
  if (!['image/jpeg', 'image/png'].includes(value.type) || value.size > 5 * 1024 * 1024) errors[field] = 'Chọn ảnh JPG/PNG tối đa 5 MB.'
}
export function validateDetails(draft: EventDraft): FieldErrors {
  const errors: FieldErrors = {}
  text(errors, 'name', draft.name, 255, true); text(errors, 'description', draft.description, 255)
  text(errors, 'city', draft.city, 255, true); text(errors, 'address', draft.address, 255, true)
  if (!positiveInteger(draft.capacity)) errors.capacity = 'Nhập sức chứa là số nguyên dương.'
  image(errors, 'thumbnailImage', draft.thumbnailImage, true); image(errors, 'bannerImage', draft.bannerImage, true)
  image(errors, 'imageZone', draft.imageZone)
  const start = new Date(`${draft.startTime}+07:00`).getTime(), end = new Date(`${draft.endTime}+07:00`).getTime()
  if (!Number.isFinite(start) || start <= Date.now()) errors.startTime = 'Thời gian bắt đầu phải ở tương lai.'
  if (!Number.isFinite(end) || end <= start) errors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu.'
  return errors
}
export function validateGuest(guest: GuestDraft): FieldErrors {
  const errors: FieldErrors = {}
  text(errors, 'name', guest.name, 50, true); text(errors, 'role', guest.role, 50, true)
  text(errors, 'description', guest.description, 255); image(errors, 'imageFile', guest.imageFile)
  return errors
}
export function validateTicket(ticket: TicketDraft, draft: EventDraft): FieldErrors {
  const errors: FieldErrors = {}
  text(errors, 'name', ticket.name, 255, true); text(errors, 'description', ticket.description, 255)
  image(errors, 'imageFile', ticket.imageFile, true)
  if (!/^\d{1,17}(\.\d{1,2})?$/.test(ticket.price)) errors.price = 'Giá vé không âm, tối đa 17 chữ số nguyên và 2 chữ số thập phân.'
  if (!positiveInteger(ticket.quantity)) errors.quantity = 'Số lượng vé phải là số nguyên dương.'
  const start = new Date(`${ticket.saleStartTime}+07:00`).getTime(), end = new Date(`${ticket.saleEndTime}+07:00`).getTime()
  const eventStart = new Date(`${draft.startTime}+07:00`).getTime()
  if (!Number.isFinite(start) || start >= eventStart) errors.saleStartTime = 'Bắt đầu bán phải trước lúc sự kiện diễn ra.'
  if (!Number.isFinite(end) || end < start || end >= eventStart) errors.saleEndTime = 'Kết thúc bán không trước bắt đầu bán và phải trước sự kiện.'
  return errors
}
export function toRequest(draft: EventDraft): CreateEventRequest {
  return {
    name: draft.name.trim(), description: draft.description.trim() || null,
    startTime: toUtc(draft.startTime), endTime: toUtc(draft.endTime), categoryId: Number(draft.categoryId),
    venue: { city: draft.city.trim(), address: draft.address.trim(), capacity: Number(draft.capacity) },
    guests: draft.guests.map(({ name, role, description }) => ({ name: name.trim(), role: role.trim(), description: description.trim() || null })),
    ticketTypes: draft.ticketTypes.map(({ name, description, price, quantity, saleStartTime, saleEndTime }) => ({
      name: name.trim(), description: description.trim() || null, price, quantity: Number(quantity), saleStartTime: toUtc(saleStartTime), saleEndTime: toUtc(saleEndTime),
    })),
  }
}
export function eventError(error: unknown) {
  if (!(error instanceof ApiError)) return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
  switch (error.status) {
    case 400: return 'Thông tin chưa hợp lệ. Hãy kiểm tra thời gian, ảnh và các trường bắt buộc.'
    case 401: return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    case 403: return 'Tài khoản hiện tại không có quyền tạo sự kiện.'
    case 404: return 'Danh mục không còn tồn tại. Hãy quay lại bước 2 và chọn lại.'
    case 409: return 'Dữ liệu chưa thể lưu. Hãy kiểm tra thông tin và thử lại.'
    case 413: return 'Mỗi ảnh tối đa 5 MB; tổng hồ sơ tạo sự kiện tối đa 50 MB.'
    default: return 'Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại sau.'
  }
}
export function loadDraft(key: string): EventDraft {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null')
    if (!stored || typeof stored !== 'object') return { ...emptyDraft }
    const value = stored as Record<string, unknown>
    const fields = Object.keys(emptyDraft).filter(field => !['guests', 'ticketTypes', 'bannerImage', 'thumbnailImage', 'imageZone'].includes(field))
    if (!fields.every(field => typeof value[field] === 'string')) return { ...emptyDraft }
    const records = (items: unknown, fields: string[]) => Array.isArray(items) && items.every(item => item && typeof item === 'object' && fields.every(field => typeof (item as Record<string, unknown>)[field] === 'string'))
    if (!records(value.guests, Object.keys(emptyGuest()).filter(field => field !== 'imageFile')) || !records(value.ticketTypes, Object.keys(emptyTicket()).filter(field => field !== 'imageFile'))) return { ...emptyDraft }
    const draft = stored as EventDraft
    return { ...draft, bannerImage: null, thumbnailImage: null, imageZone: null,
      guests: draft.guests.map(guest => ({ ...guest, imageFile: null })), ticketTypes: draft.ticketTypes.map(ticket => ({ ...ticket, imageFile: null })) }
  } catch { return { ...emptyDraft } }
}
