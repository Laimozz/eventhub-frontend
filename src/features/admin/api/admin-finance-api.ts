import { httpClient } from '../../../lib/http-client'
import type { PageResult } from '../types/admin'
import type { CanceledEvent, Overview, RefundDetail, Withdrawal } from '../types/finance'

export const financeApi = {
  overview: async (signal: AbortSignal) => (await httpClient.get<Overview>('/admin/statistics', { signal })).data,
  withdrawals: async (page: number, status: string, signal: AbortSignal) =>
    (await httpClient.get<PageResult<Withdrawal>>('/admin/withdrawal-requests', { signal, params: { page, pageSize: 20, status: status || undefined } })).data,
  withdrawal: async (id: number, signal: AbortSignal) =>
    (await httpClient.get<Withdrawal>(`/admin/withdrawal-requests/${id}`, { signal })).data,
  approve: async (id: number, transactionCode: string) =>
    (await httpClient.post<Withdrawal>(`/admin/withdrawal-requests/${id}/approve`, { transactionCode })).data,
  reject: async (id: number, reason: string) =>
    (await httpClient.post<Withdrawal>(`/admin/withdrawal-requests/${id}/reject`, { reason })).data,
  canceledEvents: async (page: number, signal: AbortSignal) =>
    (await httpClient.get<PageResult<CanceledEvent>>('/admin/refund-events', { signal, params: { page, pageSize: 20 } })).data,
  refundDetail: async (id: number, page: number, signal: AbortSignal) =>
    (await httpClient.get<RefundDetail>(`/admin/refund-events/${id}`, { signal, params: { page, pageSize: 20 } })).data,
}
export const money = (amount: number | null) => amount === null ? 'Chưa xác định' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
export const financeDate = (date: string | null) => date ? new Date(`${date}Z`).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'
export const withdrawalStatus = (status: string) => ({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối' } as Record<string, string>)[status] ?? status
export function financePage(value: string | null) {
  const page = Number(value ?? 0)
  return Number.isSafeInteger(page) && page >= 0 ? page : 0
}
