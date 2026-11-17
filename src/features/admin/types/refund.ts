import type { PageResult } from './admin'

export interface RefundRow {
  id: number; paymentId: number; bookingId: number; eventId: number; eventName: string
  customerName: string | null; amount: number; status: string; method: string | null; refundedAt: string | null
}
export type RefundPage = PageResult<RefundRow>
export interface RefundDetail {
  paymentId: number; amount: number; status: string; method: string | null; reference: string | null; refundedAt: string | null
  paymentMethod: string; processedBy: number | null; eventId: number; eventCanceled: boolean
}
