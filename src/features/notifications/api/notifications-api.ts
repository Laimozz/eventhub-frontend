import { httpClient } from '../../../lib/http-client'
export interface NotificationItem { id: number; title: string; content: string; type: string; createdAt: string; read: boolean }
export interface NotificationPage { items: NotificationItem[]; page: number; totalPages: number; totalElements: number }
export function getNotifications(page: number, signal: AbortSignal) {
  return httpClient.get<NotificationPage>('/notifications', { params: { page }, signal }).then(response => response.data)
}
