export interface Category { id: number; name: string; description: string | null }
export interface GuestDraft { key: string; name: string; role: string; description: string; imageFile: File | null }
export interface TicketDraft {
  key: string; name: string; description: string; imageFile: File | null; price: string
  quantity: string; saleStartTime: string; saleEndTime: string
}
export interface EventDraft {
  name: string; description: string; city: string; address: string; capacity: string
  thumbnailImage: File | null; bannerImage: File | null; imageZone: File | null
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
export type FieldErrors = Record<string, string>
