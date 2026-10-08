export interface Category { id: number; name: string; description: string | null }
export interface GuestDraft { key: string; id?: number; name: string; role: string; description: string; imageFile: File | null; imageUrl?: string | null; removeImage?: boolean }
export interface TicketDraft {
  key: string; id?: number; name: string; description: string; imageFile: File | null; imageUrl?: string | null; price: string; allocatedQuantity?: number
  quantity: string; saleStartTime: string; saleEndTime: string
}
export interface EventDraft {
  name: string; description: string; city: string; address: string; capacity: string
  thumbnailImage: File | null; bannerImage: File | null; imageZone: File | null
  thumbnailImageUrl?: string | null; bannerImageUrl?: string | null; imageZoneUrl?: string | null; removeImageZone?: boolean
  startTime: string; endTime: string; categoryId: string; guests: GuestDraft[]; ticketTypes: TicketDraft[]
}
export interface CreateEventRequest {
  name: string; description: string | null; startTime: string; endTime: string; categoryId: number
  venue: { city: string; address: string; capacity: number }
  guests: { name: string; role: string; description: string | null }[]
  ticketTypes: {
    name: string; description: string | null; price: string; quantity: number
    saleStartTime: string; saleEndTime: string
  }[]
}
export interface CreatedEvent { id: number; name: string; status: 'PENDING_APPROVAL' }
export type EventStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ONGOING' | 'COMPLETED' | 'PENDING_CANCELLATION' | 'CANCELED'
export interface EventSummary {
  id: number; name: string; description: string | null; thumbnailImageUrl: string
  categoryName: string; city: string; address: string; startTime: string; endTime: string
  status: EventStatus; canEdit: boolean; canCancel: boolean
}
export interface EventDetail {
  id: number; organizerId: number; categoryId: number; categoryName: string; name: string; description: string | null
  thumbnailImageUrl: string; bannerImageUrl: string; imageZoneUrl: string | null
  startTime: string; endTime: string; createdAt: string; status: EventStatus; canEdit: boolean; canCancel: boolean
  cancelReason: string | null; canceledAt: string | null
  rejectReason: string | null
  venue: { id: number; city: string; address: string; capacity: number }
  ticketTypes: { id: number; name: string; description: string | null; imageUrl: string; price: number | string
    quantity: number; reservedQuantity: number; remainingQuantity: number; saleStartTime: string; saleEndTime: string; status: string }[]
  guests: { id: number; name: string; role: string; description: string | null; imageUrl: string | null }[]
}
export interface EventList {
  content: EventSummary[]; page: number; size: number; totalElements: number; totalPages: number
  statusCounts: Record<EventStatus, number>
}
export type FieldErrors = Record<string, string>
