import type { PageResult } from './admin'

export interface RefundRow {
  id: number; paymentId: number; bookingId: number; eventId: number; eventName: string
  customerName: string | null; amount: number; status: string; method: string | null; refundedAt: string | null
}
export type RefundPage = PageResult<RefundRow>
export interface BankAccountInput {
  bankCode: string; accountNumber: string; accountHolderName: string; originalAccountVerified: boolean
}
export interface RefundDetail {
  paymentId: number; amount: number; status: string; method: string | null; reference: string | null; refundedAt: string | null
  bankAccount: (Omit<BankAccountInput, 'originalAccountVerified'> & { verifiedBy: number | null; verifiedAt: string | null }) | null
  attempts: { command: string; outcome: string; responseCode: string | null; transactionStatus: string | null; createdAt: string; diagnosticCode?: string | null; diagnosticStage?: string | null; diagnosticMessage?: string | null; httpStatus?: number | null }[]
  hasEvidence: boolean
  requestedBy: number | null
  lastError?: string | null
}
