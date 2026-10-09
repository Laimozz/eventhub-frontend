import { httpClient } from '../../../lib/http-client'
import type { CheckinResult } from '../types/staff'

export async function checkinTicket(ticketCode: string): Promise<CheckinResult> {
  const response = await httpClient.post<CheckinResult>('/staff/check-in', { ticketCode })
  return response.data
}
