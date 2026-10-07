import type { EventStatus } from './types/event'

export const eventStatuses: Record<EventStatus, { label: string; tone: string }> = {
  PENDING_APPROVAL: { label: 'Chờ duyệt', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt', tone: 'green' },
  ONGOING: { label: 'Đang diễn ra', tone: 'blue' },
  COMPLETED: { label: 'Đã kết thúc', tone: 'gray' },
  PENDING_CANCELLATION: { label: 'Chờ hủy', tone: 'red' },
  CANCELED: { label: 'Đã hủy', tone: 'red' },
}
export function eventDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(`${value}Z`))
}
