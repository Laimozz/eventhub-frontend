export interface CheckinResult {
  success: boolean
  message: string
  ticketId?: number
  ticketCode: string
  attendeeName: string
  ticketType: string
  checkedInAt?: string
}

export interface StaffAssignedEventDto {
  assignmentId: number
  eventId: number
  eventName: string
  description: string | null
  thumbnailImageUrl: string
  bannerImageUrl: string
  startTime: string
  endTime: string
  eventStatus: string
  venueCity: string | null
  venueAddress: string | null
  staffStatus: string // 'ACTIVE' | 'INACTIVE'
  assignedAt: string
  organizerName: string | null
  totalTickets: number
  checkedInTickets: number
}

export type StaffStatusFilter = 'ALL' | 'ONGOING' | 'APPROVED' | 'COMPLETED'

export interface StaffFilterState {
  search: string
  selectedDate: string // YYYY-MM-DD hoặc rỗng cho tất cả
  statusFilter: StaffStatusFilter
  organizer: string // Tên nhà tổ chức hoặc rỗng cho tất cả
}

// --- DTOs cho Màn hình Chi tiết Sự kiện & Quản lý vé của Staff ---

export interface StaffEventDetailDto {
  eventId: number
  eventName: string
  description: string | null
  thumbnailImageUrl: string
  bannerImageUrl: string
  imageZoneUrl: string | null
  startTime: string
  endTime: string
  eventStatus: string
  venueCity: string | null
  venueAddress: string | null
  venueCapacity: number | null
  organizerName: string | null
  staffStatus: string
  assignedAt: string
}

export interface StaffCustomerDto {
  id: number
  fullName: string
  email: string
  phone: string | null
  ticketCount: number
}

export interface StaffTicketTypeDto {
  id: number
  name: string
  price: number
  quantity: number
}

export interface StaffTicketStatsDto {
  totalTickets: number
  checkedInTickets: number
  remainingTickets: number
  checkInRate: number
}

export interface StaffTicketDto {
  ticketId: number
  ticketCode: string
  status: 'VALID' | 'USED' | 'CANCELLED' | string
  checkedInAt: string | null
  customerId: number
  customerName: string
  customerEmail: string
  customerPhone: string | null
  ticketTypeId: number
  ticketTypeName: string
  ticketPrice: number
  checkedInByName: string | null
}

export interface StaffTicketPageResponse {
  items: StaffTicketDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface StaffTicketFilterState {
  customerId: number | ''
  ticketTypeId: number | ''
  status: 'ALL' | 'VALID' | 'USED'
  search: string
}
