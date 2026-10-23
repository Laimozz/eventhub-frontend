import type { Organizer, PageResult } from './admin'

export interface Overview {
  totalEvents: number
  totalUsers: number
  totalTicketsSold: number
  pendingBalance: number
  availableBalance: number
  withdrawalPendingBalance: number
  totalWithdrawn: number
  grossRevenue: number | null
  netRevenue: number | null
  totalRefunded: number
  revenueUnavailableReason: string
}
export interface Payout {
  id: number
  amount: number
  status: string
  transactionCode: string | null
  failureReason: string | null
  initiatedAt: string
  completedAt: string | null
}
export interface Withdrawal {
  id: number
  organizer: Organizer
  amount: number
  bankName: string
  accountNumber: string | null
  status: string
  requestedAt: string
  processedBy: number | null
  processedAt: string | null
  rejectReason: string | null
  transactionCode: string | null
  payouts: Payout[]
}
export interface CanceledEvent {
  id: number
  name: string
  organizer: Organizer
  cancelReason: string | null
}
export interface RefundPayment {
  id: number
  bookingId: number
  customerName: string | null
  paidAmount: number | null
  paymentStatus: string | null
  paidAt: string | null
  refundId: number | null
  refundAmount: number | null
  refundStatus: string | null
  retryCount: number | null
  refundedAt: string | null
}
export interface RefundDetail {
  eventId: number
  eventName: string
  cancelReason: string | null
  payments: PageResult<RefundPayment>
  canRefund: boolean
  unavailableReason: string
}
