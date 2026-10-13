import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import styles from './NotificationBell.module.css'

export function NotificationBell() {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  if (!user || user.role === 'STAFF') return null
  const paths = { ADMIN: '/admin/notifications', ORGANIZER: '/organizer/notifications', CUSTOMER: '/customer/thong-bao' }
  const label = unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'
  return <Link className={styles.bell} to={paths[user.role]} aria-label={label} title={label}>
    <Bell size={22} aria-hidden="true" />
    {unreadCount > 0 && <span className={styles.count} aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
  </Link>
}
