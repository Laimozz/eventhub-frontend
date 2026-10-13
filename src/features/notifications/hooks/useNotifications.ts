import { createContext, useContext } from 'react'

export interface NotificationsState {
  unreadCount: number
  revision: number
  refresh: () => Promise<void>
}

export const NotificationsContext = createContext<NotificationsState | null>(null)

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('NotificationsProvider is required')
  return context
}
