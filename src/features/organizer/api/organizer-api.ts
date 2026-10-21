import { httpClient } from '../../../lib/http-client'
import type {
  CreateWithdrawalRequest,
  EventRevenueItem,
  OrganizerRevenueSummary,
  OrganizerWallet,
  WithdrawalPreview,
  WithdrawalRequestItem,
} from '../types/organizer'

export async function getOrganizerWallet(signal?: AbortSignal): Promise<OrganizerWallet> {
  const response = await httpClient.get<any>('/organizer/wallet', { signal })
  const data = response.data
  return {
    ...data,
    availableBalance: Number(data.availableBalance ?? 0),
    pendingBalance: Number(data.pendingBalance ?? 0),
    withdrawalPendingBalance: Number(data.withdrawalPendingBalance ?? 0),
    totalWithdrawn: Number(data.totalWithdrawn ?? 0),
    formattedAvailableBalance: data.formattedAvailableBalance || '0đ',
    formattedPendingBalance: data.formattedPendingBalance || '0đ',
    formattedWithdrawalPendingBalance: data.formattedWithdrawalPendingBalance || '0đ',
    formattedTotalWithdrawn: data.formattedTotalWithdrawn || '0đ',
  }
}

export async function getOrganizerRevenue(signal?: AbortSignal): Promise<OrganizerRevenueSummary> {
  const response = await httpClient.get<any>('/organizer/revenue', { signal })
  const data = response.data
  const rawList: any[] = data.eventRevenues || data.events || []

  const events: EventRevenueItem[] = rawList.map((item) => {
    const rev = Number(item.revenue ?? item.totalRevenue ?? 0)
    const sold = Number(item.soldTickets ?? item.totalTicketsSold ?? 0)
    const total = Number(item.totalTickets ?? 0)
    return {
      eventId: item.eventId,
      eventName: item.eventName || `Sự kiện #${item.eventId}`,
      revenue: rev,
      formattedRevenue: item.formattedRevenue || `${rev.toLocaleString('vi-VN')} đ`,
      soldTickets: sold,
      totalTickets: total,
      totalRevenue: rev,
      totalTicketsSold: sold,
    }
  })

  const totalRev = events.reduce((acc, curr) => acc + curr.revenue, 0)
  const totalSold = events.reduce((acc, curr) => acc + curr.soldTickets, 0)

  return {
    pendingBalance: Number(data.pendingBalance ?? 0),
    formattedPendingBalance: data.formattedPendingBalance || '0đ',
    availableBalance: Number(data.availableBalance ?? 0),
    formattedAvailableBalance: data.formattedAvailableBalance || '0đ',
    withdrawalPendingBalance: Number(data.withdrawalPendingBalance ?? 0),
    formattedWithdrawalPendingBalance: data.formattedWithdrawalPendingBalance || '0đ',
    totalWithdrawn: Number(data.totalWithdrawn ?? 0),
    formattedTotalWithdrawn: data.formattedTotalWithdrawn || '0đ',
    eventRevenues: events,
    events: events,
    totalRevenue: totalRev,
    formattedTotalRevenue: `${totalRev.toLocaleString('vi-VN')} đ`,
    totalTicketsSold: totalSold,
    totalActiveEvents: events.length,
  }
}

export async function previewWithdrawal(data: CreateWithdrawalRequest): Promise<WithdrawalPreview> {
  const response = await httpClient.post<any>('/organizer/withdrawals/preview', data)
  const d = response.data
  const curBal = Number(d.currentAvailableBalance ?? d.availableBalanceBefore ?? 0)
  const fmtCurBal = d.formattedCurrentAvailableBalance || d.formattedAvailableBalanceBefore || `${curBal.toLocaleString('vi-VN')} đ`
  const balAfter = Number(d.availableBalanceAfter ?? 0)
  const fmtBalAfter = d.formattedAvailableBalanceAfter || `${balAfter.toLocaleString('vi-VN')} đ`

  return {
    amount: Number(d.amount ?? 0),
    formattedAmount: d.formattedAmount || `${Number(d.amount ?? 0).toLocaleString('vi-VN')} đ`,
    bankName: d.bankName || '',
    accountNumber: d.accountNumber || '',
    currentAvailableBalance: curBal,
    formattedCurrentAvailableBalance: fmtCurBal,
    availableBalanceBefore: curBal,
    formattedAvailableBalanceBefore: fmtCurBal,
    availableBalanceAfter: balAfter,
    formattedAvailableBalanceAfter: fmtBalAfter,
  }
}

export async function createWithdrawal(data: CreateWithdrawalRequest): Promise<WithdrawalRequestItem> {
  const response = await httpClient.post<WithdrawalRequestItem>('/organizer/withdrawals', data)
  return response.data
}

export async function getWithdrawals(status?: string, signal?: AbortSignal): Promise<WithdrawalRequestItem[]> {
  const params = status ? { status } : undefined
  const response = await httpClient.get<WithdrawalRequestItem[]>('/organizer/withdrawals', { params, signal })
  return response.data
}

export async function getWithdrawalDetail(id: number, signal?: AbortSignal): Promise<WithdrawalRequestItem> {
  const response = await httpClient.get<WithdrawalRequestItem>(`/organizer/withdrawals/${id}`, { signal })
  return response.data
}

export async function cancelWithdrawal(id: number): Promise<WithdrawalRequestItem> {
  const response = await httpClient.post<WithdrawalRequestItem>(`/organizer/withdrawals/${id}/cancel`)
  return response.data
}

