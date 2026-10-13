export type BookingStatus = 'PENDING' | 'PAYMENT_CONFIRMING' | 'PAID' | 'EXPIRED' | 'PAYMENT_REVIEW'
export interface BookingEvent {
  id: number; name: string; thumbnailImageUrl: string | null; status: string
  startTime: string; endTime: string; city: string; address: string
}
export interface TicketInfo {
  id: number; ticketCode: string; qrToken: string | null; status: string; checkedInAt: string | null
}
export interface BookingItem {
  id: number; ticketTypeId: number; ticketTypeName: string; quantity: number
  unitPrice: number; subtotal: number; tickets: TicketInfo[]
}
export interface BookingPayment {
  id: number; transactionId: string; gatewayTransactionId: string | null
  paymentMethod: string; amount: number; status: string; responseCode: string | null
  createdAt: string; paidAt: string | null
}
export interface BookingSummary {
  id: number; status: BookingStatus; totalAmount: number; currency: string
  createdAt: string; expiredAt: string; paymentConfirmationDeadline: string | null; event: BookingEvent
}
export interface BookingDetail extends BookingSummary { items: BookingItem[]; payments: BookingPayment[] }
export interface PageResponse<T> { items: T[]; page: number; size: number; totalElements: number; totalPages: number }
export interface TicketType {
  id: number; name: string; description: string | null; imageUrl: string; price: number; currency: string
  remainingQuantity: number; saleStartTime: string; saleEndTime: string; bookable: boolean
}
export interface PaymentUrl {
  bookingId: number; paymentId: number; transactionId: string; paymentUrl: string; expiredAt: string
}
export interface PaymentReturn {
  bookingId: number; bookingStatus: BookingStatus; paymentStatus: string; responseCode: string; transactionStatus: string
}
export interface ElectronicTicket extends TicketInfo {
  bookingId: number; ticketTypeName: string; unitPrice: number; ownerName: string | null
  canCheckIn: boolean; event: BookingEvent
}
