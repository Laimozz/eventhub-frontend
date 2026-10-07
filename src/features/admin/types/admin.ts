import type { User } from '../../auth/types/auth'

export interface AdminStats {
  totalUsers: number
  totalEvents: number
  pendingEvents: number
  totalRevenue: number
}

export interface AdminUserItem extends User {
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE'
  createdAt?: string
}

export interface AdminEventApprovalItem {
  id: number
  title: string
  organizerName: string
  categoryName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}
