import { utcDate } from './booking-display'
import type { PublicEventSummaryResponse, TicketSalesStatus } from './types/event'

export const ticketSalesLabels: Record<TicketSalesStatus, string> = {
  NOT_ON_SALE: 'Chưa mở bán',
  ON_SALE: 'Đang mở bán',
  SOLD_OUT: 'Hết vé',
  SALES_ENDED: 'Đã đóng bán',
  UNAVAILABLE: 'Tạm ngừng bán',
}

export function customerEventState(event: Pick<PublicEventSummaryResponse, 'status' | 'salesStatus' | 'startTime' | 'endTime'>) {
  const now = Date.now()
  const completed = event.status === 'COMPLETED' || now >= utcDate(event.endTime).getTime()
  const ongoing = !completed && (event.status === 'ONGOING' || now >= utcDate(event.startTime).getTime())
  const salesStatus = completed || ongoing ? 'SALES_ENDED' : event.salesStatus || 'UNAVAILABLE'
  const eventLabel = event.status === 'CANCELED' ? 'Đã hủy' : completed ? 'Đã kết thúc' : ongoing ? 'Đang diễn ra' : 'Sắp diễn ra'
  const canBook = !completed && !ongoing && event.status === 'APPROVED' && salesStatus === 'ON_SALE'
  return {
    canBook,
    eventLabel,
    salesLabel: ticketSalesLabels[salesStatus],
    badgeLabel: completed || ongoing || event.status === 'CANCELED' ? eventLabel : ticketSalesLabels[salesStatus],
    actionLabel: canBook ? 'Đặt vé ngay' : completed || ongoing || event.status === 'CANCELED' ? eventLabel : ticketSalesLabels[salesStatus],
  }
}
