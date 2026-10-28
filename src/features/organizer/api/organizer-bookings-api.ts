import { httpClient } from '../../../lib/http-client'
import type {
  BookingQueryParams,
  OrganizerBookingDetail,
  OrganizerBookingPageResponse,
} from '../types/bookings'

export async function getOrganizerBookings(
  params?: BookingQueryParams,
  signal?: AbortSignal
): Promise<OrganizerBookingPageResponse> {
  const query: Record<string, string | number> = {}
  if (params?.eventId) query.eventId = params.eventId
  if (params?.status && params.status !== 'ALL') query.status = params.status
  if (params?.keyword) query.keyword = params.keyword
  if (params?.startDate) query.startDate = params.startDate
  if (params?.endDate) query.endDate = params.endDate
  if (params?.page !== undefined) query.page = params.page
  if (params?.size !== undefined) query.size = params.size

  const response = await httpClient.get<OrganizerBookingPageResponse>(
    '/organizer/bookings',
    { params: query, signal }
  )
  return response.data
}

export async function getOrganizerBookingDetail(
  bookingId: number,
  signal?: AbortSignal
): Promise<OrganizerBookingDetail> {
  const response = await httpClient.get<OrganizerBookingDetail>(
    `/organizer/bookings/${bookingId}`,
    { signal }
  )
  return response.data
}

export async function exportOrganizerBookingsCsv(
  params?: BookingQueryParams
): Promise<void> {
  const query: Record<string, string | number> = {}
  if (params?.eventId) query.eventId = params.eventId
  if (params?.status && params.status !== 'ALL') query.status = params.status
  if (params?.keyword) query.keyword = params.keyword
  if (params?.startDate) query.startDate = params.startDate
  if (params?.endDate) query.endDate = params.endDate

  const response = await httpClient.get('/organizer/bookings/export-csv', {
    params: query,
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}
