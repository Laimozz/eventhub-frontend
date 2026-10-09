import type { EventDetail } from '../../events/types/event'

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface AdminUser {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: string
  status: string
}

export interface Category {
  id: number
  name: string
  description: string
}

export interface Organizer {
  id: number
  fullName: string
  email: string
}

export interface PendingEvent {
  id: number
  name: string
  thumbnailImageUrl: string
  categoryName: string
  organizer: Organizer
  createdAt: string
  status: string
}

export interface ReviewDetail {
  event: EventDetail
  organizer: Organizer
  version: number
}
