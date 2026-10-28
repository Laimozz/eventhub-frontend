export interface OrganizerBookingSummary {
  id: number
  status: string
  statusLabel: string
  totalAmount: number
  formattedTotalAmount: string
  totalTickets: number
  createdAt: string | null
  expiredAt: string | null
  eventId: number
  eventName: string
  customerId: number
  customerName: string
  customerEmail: string
  customerPhone: string
}

export interface OrganizerBookingOverview {
  totalBookings: number
  totalRevenue: number
  formattedTotalRevenue: string
  paidCount: number
  pendingCount: number
  cancelledCount: number
  otherCount: number
}

export interface OrganizerBookingPageResponse {
  items: OrganizerBookingSummary[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  overview: OrganizerBookingOverview
}

export interface BookingItemInfo {
  id: number
  ticketTypeId: number
  ticketTypeName: string
  quantity: number
  unitPrice: number
  formattedUnitPrice: string
  subtotal: number
  formattedSubtotal: string
}

export interface BookingTicketInfo {
  id: number
  ticketCode: string
  ticketTypeName: string
  status: string
  checkedInAt: string | null
  checkedInByName: string | null
}

export interface BookingPaymentInfo {
  id: number
  transactionId: string
  paymentMethod: string
  amount: number
  formattedAmount: string
  status: string
  paidAt: string | null
  createdAt: string | null
}

export interface BookingRefundInfo {
  id: number
  refundTransactionId: string
  amount: number
  formattedAmount: string
  status: string
  refundedAt: string | null
}

export interface OrganizerBookingDetail {
  id: number
  status: string
  statusLabel: string
  totalAmount: number
  formattedTotalAmount: string
  createdAt: string | null
  expiredAt: string | null
  eventId: number
  eventName: string
  venueName: string
  eventStartTime: string | null
  eventEndTime: string | null
  customerId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  items: BookingItemInfo[]
  tickets: BookingTicketInfo[]
  payments: BookingPaymentInfo[]
  refund: BookingRefundInfo | null
}

export interface BookingQueryParams {
  eventId?: number | ''
  status?: string
  keyword?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}
