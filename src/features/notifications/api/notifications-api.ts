import { httpClient } from '../../../lib/http-client'
export interface NotificationItem { id: number; title: string | null; content: string | null; type: string | null; createdAt: string; read: boolean }
export interface NotificationPage { items: NotificationItem[]; page: number; totalPages: number; totalElements: number }
export function getNotifications(page: number, signal?: AbortSignal) {
  return httpClient.get<NotificationPage>('/notifications', { params: { page }, signal }).then(response => response.data)
}

export function getUnreadCount(signal?: AbortSignal) {
  return httpClient.get<number>('/notifications/unread-count', { signal }).then(response => response.data)
}

export function markNotificationRead(id: number) {
  return httpClient.patch<void>(`/notifications/${id}/read`)
}

export function markAllNotificationsRead() {
  return httpClient.patch<void>('/notifications/read-all')
}

export function notificationStreamUrl() {
  return httpClient.getUri({ url: '/notifications/stream' })
}
