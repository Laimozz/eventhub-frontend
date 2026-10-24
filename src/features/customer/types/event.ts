export type PublicEventStatus = 'APPROVED' | 'ONGOING' | 'COMPLETED' | 'CANCELED'
export type TicketSalesStatus = 'NOT_ON_SALE' | 'ON_SALE' | 'SOLD_OUT' | 'SALES_ENDED' | 'UNAVAILABLE'

export interface PublicTicketType {
  id: number
  name: string
  description: string | null
  price: number
  remainingQuantity: number
  saleStartTime: string
  saleEndTime: string
  salesStatus: TicketSalesStatus
}

export interface PublicEventSummaryResponse {
  id: number
  name: string
  thumbnailImageUrl: string | null
  startTime: string
  endTime: string
  city: string
  startingPrice: number | null
  status: PublicEventStatus
  salesStatus: TicketSalesStatus
  categoryName?: string
  recLogId?: number | null
  similarityScore?: number | null
}

export interface PublicEventListResponse {
  content: PublicEventSummaryResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PublicEventDetailResponse {
  id: number
  name: string
  description: string | null
  thumbnailImageUrl: string | null
  bannerImageUrl: string | null
  imageZoneUrl: string | null
  startTime: string
  endTime: string
  organizerName: string
  categoryName: string
  venue: {
    city: string
    address: string
  }
  startingPrice: number | null
  suggestedEvents: PublicEventSummaryResponse[]
  status: PublicEventStatus
  salesStatus: TicketSalesStatus
  ticketTypes: PublicTicketType[]
  lineup?: string[]
  floorMapSvg?: string
}

export interface CategoryResponse {
  id: number
  name: string
  description: string | null
}
