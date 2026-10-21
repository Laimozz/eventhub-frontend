import { get, post, httpClient } from '../../../lib/http-client'
import type { BookingDetail, BookingSummary, ElectronicTicket, PageResponse, PaymentReturn, PaymentUrl, TicketType } from '../types/booking'

export const getTicketTypes = (eventId: number) => get<TicketType[]>(`/bookings/events/${eventId}/ticket-types`)
export const createBooking = (eventId: number, items: { ticketTypeId: number; quantity: number }[]) =>
  post<BookingDetail>('/bookings', { eventId, items })
export const getBooking = async (id: number, signal?: AbortSignal) =>
  (await httpClient.get<BookingDetail>(`/bookings/${id}`, { signal })).data
export const getBookings = async (page: number, signal?: AbortSignal) =>
  (await httpClient.get<PageResponse<BookingSummary>>('/bookings', { params: { page, size: 10 }, signal })).data
export const startPayment = (bookingId: number) => post<PaymentUrl>(`/bookings/${bookingId}/payments/vnpay`)
export const verifyPaymentReturn = async (query: string, signal?: AbortSignal) =>
  (await httpClient.get<PaymentReturn>(`/payments/vnpay/return?${query}`, { signal })).data
export const getTickets = async (page: number, status?: string, bookingId?: number, signal?: AbortSignal) =>
  (await httpClient.get<PageResponse<ElectronicTicket>>('/tickets', { params: { page, size: 10, status, bookingId }, signal })).data

export function redirectToPayment(url: string) {
  const target = new URL(url)
  if (target.protocol !== 'https:' || target.username || target.password) throw new Error('URL thanh toán không hợp lệ.')
  window.location.assign(target.href)
}
