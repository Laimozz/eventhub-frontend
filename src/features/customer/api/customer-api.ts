import { httpClient } from '../../../lib/http-client'
import type { CustomerEventItem, CustomerTicketItem } from '../types/customer'

export async function getPublicEvents(): Promise<CustomerEventItem[]> {
  const response = await httpClient.get<CustomerEventItem[]>('/events')
  return response.data
}

export async function getEventDetail(eventId: number): Promise<CustomerEventItem> {
  const response = await httpClient.get<CustomerEventItem>(`/events/${eventId}`)
  return response.data
}

export async function getMyTickets(): Promise<CustomerTicketItem[]> {
  const response = await httpClient.get<CustomerTicketItem[]>('/my-tickets')
  return response.data
}
