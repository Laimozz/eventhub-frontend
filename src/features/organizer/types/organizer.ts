export interface EventRevenueItem {
  eventId: number
  eventName: string
  revenue: number
  formattedRevenue: string
  soldTickets: number
  totalTickets: number
  // Aliases for compatibility
  totalRevenue: number
  totalTicketsSold: number
  status?: string
}

export interface OrganizerRevenueSummary {
  pendingBalance: number
  formattedPendingBalance: string
  availableBalance: number
  formattedAvailableBalance: string
  withdrawalPendingBalance: number
  formattedWithdrawalPendingBalance: string
  totalWithdrawn: number
  formattedTotalWithdrawn: string
  eventRevenues: EventRevenueItem[]
  events: EventRevenueItem[]
  totalRevenue: number
  formattedTotalRevenue: string
  totalTicketsSold: number
  totalActiveEvents: number
}

export interface OrganizerWallet {
  organizerId?: number
  availableBalance: number
  formattedAvailableBalance: string
  pendingBalance: number
  formattedPendingBalance: string
  withdrawalPendingBalance: number
  formattedWithdrawalPendingBalance: string
  totalWithdrawn: number
  formattedTotalWithdrawn: string
  eventRevenues?: EventRevenueItem[]
  events?: EventRevenueItem[]
}

export interface CreateWithdrawalRequest {
  amount: number
  bankName: string
  accountNumber: string
}

export interface WithdrawalPreview {
  amount: number
  formattedAmount: string
  bankName: string
  accountNumber: string
  currentAvailableBalance: number
  formattedCurrentAvailableBalance: string
  availableBalanceBefore: number
  formattedAvailableBalanceBefore: string
  availableBalanceAfter: number
  formattedAvailableBalanceAfter: string
}

export interface WithdrawalRequestItem {
  id: number
  amount: number
  formattedAmount: string
  bankName: string
  accountNumber: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CANCELED' | string
  statusDisplay: string
  requestedAt: string
  processedAt: string | null
  rejectReason: string | null
  transactionCode: string | null
  canCancel: boolean
  availableBalanceAfter?: number
  formattedAvailableBalanceAfter?: string
}

