import { httpClient } from '../../../lib/http-client'
import type { AdminEventApprovalItem, AdminStats, AdminUserItem } from '../types/admin'

export async function getAdminStats(): Promise<AdminStats> {
  const response = await httpClient.get<AdminStats>('/admin/stats')
  return response.data
}

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const response = await httpClient.get<AdminUserItem[]>('/admin/users')
  return response.data
}

export async function getPendingEvents(): Promise<AdminEventApprovalItem[]> {
  const response = await httpClient.get<AdminEventApprovalItem[]>('/admin/events/pending')
  return response.data
}

export async function approveEvent(eventId: number): Promise<void> {
  await httpClient.post(`/admin/events/${eventId}/approve`)
}

export async function rejectEvent(eventId: number, reason: string): Promise<void> {
  await httpClient.post(`/admin/events/${eventId}/reject`, { reason })
}
