export interface PublicEventSummaryResponse {
  id: number
  name: string
  thumbnailImageUrl: string | null
  startTime: string
  endTime: string
  city: string
  startingPrice: number | null
  categoryName?: string
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
  lineup?: string[]
  floorMapSvg?: string
}

export interface CategoryResponse {
  id: number
  name: string
  description: string | null
}
