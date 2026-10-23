import { httpClient } from '../../../lib/http-client'
import type { PageResult } from '../types/admin'
import type { CanceledEvent, Overview, RefundDetail, Withdrawal } from '../types/finance'

export const financeApi = {
  refunds: async (eventId: number | undefined, page: number, signal: AbortSignal) =>
    (await httpClient.get<import('../types/refund').RefundPage>('/admin/refunds', { signal, params: { eventId, page, pageSize: 20 } })).data,
  refund: async (paymentId: number, signal?: AbortSignal) =>
    (await httpClient.get<import('../types/refund').RefundDetail>(`/admin/refunds/${paymentId}`, { signal })).data,
  queueRefund: async (paymentId: number) => (await httpClient.post(`/admin/refunds/${paymentId}/automatic`)).data,
  queueEventRefunds: async (eventId: number) =>
    (await httpClient.post<{ queuedCount: number }>(`/admin/refund-events/${eventId}/refunds`)).data,
  reconcileRefund: async (paymentId: number) => (await httpClient.post(`/admin/refunds/${paymentId}/reconcile`, undefined, { timeout: 30000 })).data,
  saveRefundAccount: async (paymentId: number, account: import('../types/refund').BankAccountInput) =>
    (await httpClient.put(`/admin/refunds/${paymentId}/bank-account`, account)).data,
  reserveManualRefund: async (paymentId: number) => (await httpClient.post(`/admin/refunds/${paymentId}/manual-reservation`)).data,
  confirmManualRefund: async (paymentId: number, transactionCode: string, evidence: File) => {
    const body = new FormData(); body.append('transactionCode', transactionCode); body.append('evidence', evidence)
    return (await httpClient.post(`/admin/refunds/${paymentId}/manual-confirmation`, body)).data
  },
  refundEvidence: async (paymentId: number) => (await httpClient.get<Blob>(`/admin/refunds/${paymentId}/evidence`, { responseType: 'blob' })).data,
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
export const withdrawalStatus = (status: string) => ({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối', CANCELLED: 'Đã hủy' } as Record<string, string>)[status] ?? status
export function financePage(value: string | null) {
  const page = Number(value ?? 0)
  return Number.isSafeInteger(page) && page >= 0 ? page : 0
}
