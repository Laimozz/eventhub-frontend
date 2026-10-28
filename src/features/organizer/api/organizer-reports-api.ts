import { httpClient } from '../../../lib/http-client'
import type {
  EventFilterOption,
  OrganizerReportData,
  ReportQueryParams,
} from '../types/reports'

export async function getOrganizerReports(
  params?: ReportQueryParams,
  signal?: AbortSignal
): Promise<OrganizerReportData> {
  const query: Record<string, string | number> = {}
  if (params?.eventId) query.eventId = params.eventId
  if (params?.timeRange) query.timeRange = params.timeRange
  if (params?.startDate) query.startDate = params.startDate
  if (params?.endDate) query.endDate = params.endDate

  const response = await httpClient.get<OrganizerReportData>('/organizer/reports', {
    params: query,
    signal,
  })
  return response.data
}

export async function getEventFilterOptions(
  signal?: AbortSignal
): Promise<EventFilterOption[]> {
  const response = await httpClient.get<EventFilterOption[]>('/organizer/reports/events-filter', {
    signal,
  })
  return response.data
}

export async function exportOrganizerReportCsv(
  params?: ReportQueryParams
): Promise<void> {
  const query: Record<string, string | number> = {}
  if (params?.eventId) query.eventId = params.eventId
  if (params?.timeRange) query.timeRange = params.timeRange
  if (params?.startDate) query.startDate = params.startDate
  if (params?.endDate) query.endDate = params.endDate

  const response = await httpClient.get('/organizer/reports/export-csv', {
    params: query,
    responseType: 'blob',
  })

  // Create download link
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `bao-cao-thong-ke-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}
