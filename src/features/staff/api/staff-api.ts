import { httpClient } from '../../../lib/http-client'
import type {
  CheckinResult,
  StaffAssignedEventDto,
  StaffCustomerDto,
  StaffEventDetailDto,
  StaffTicketPageResponse,
  StaffTicketStatsDto,
  StaffTicketTypeDto,
} from '../types/staff'

export async function getMyAssignedEvents(): Promise<StaffAssignedEventDto[]> {
  const response = await httpClient.get<StaffAssignedEventDto[]>('/staff/events')
  return response.data
}

export async function getStaffEventDetail(eventId: number): Promise<StaffEventDetailDto> {
  const response = await httpClient.get<StaffEventDetailDto>(`/staff/events/${eventId}`)
  return response.data
}

export async function getStaffEventCustomers(eventId: number): Promise<StaffCustomerDto[]> {
  const response = await httpClient.get<StaffCustomerDto[]>(`/staff/events/${eventId}/customers`)
  return response.data
}

export async function getStaffEventTicketTypes(eventId: number): Promise<StaffTicketTypeDto[]> {
  const response = await httpClient.get<StaffTicketTypeDto[]>(`/staff/events/${eventId}/ticket-types`)
  return response.data
}

export async function getStaffEventTicketStats(eventId: number): Promise<StaffTicketStatsDto> {
  const response = await httpClient.get<StaffTicketStatsDto>(`/staff/events/${eventId}/stats`)
  return response.data
}

export interface GetStaffTicketsParams {
  customerId?: number | ''
  ticketTypeId?: number | ''
  status?: string
  page?: number
  size?: number
}

export async function getStaffEventTickets(
  eventId: number,
  params: GetStaffTicketsParams = {}
): Promise<StaffTicketPageResponse> {
  const queryParams: Record<string, string | number> = {}
  if (params.customerId) queryParams.customerId = params.customerId
  if (params.ticketTypeId) queryParams.ticketTypeId = params.ticketTypeId
  if (params.status && params.status !== 'ALL') queryParams.status = params.status
  if (params.page !== undefined) queryParams.page = params.page
  if (params.size !== undefined) queryParams.size = params.size

  const response = await httpClient.get<StaffTicketPageResponse>(`/staff/events/${eventId}/tickets`, {
    params: queryParams,
  })
  return response.data
}

export async function checkInStaffTicket(
  eventId: number,
  payload: { ticketId?: number; ticketCode?: string }
): Promise<CheckinResult> {
  const response = await httpClient.post<CheckinResult>(`/staff/events/${eventId}/check-in`, payload)
  return response.data
}

// Fallback legacy checkin method
export async function checkinTicket(ticketCode: string): Promise<CheckinResult> {
  const response = await httpClient.post<CheckinResult>('/staff/check-in', { ticketCode })
  return response.data
}
