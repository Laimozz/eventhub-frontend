export interface CustomerEventItem {
  id: number
  title: string
  description?: string
  bannerUrl?: string
  locationName: string
  startTime: string
  minPrice: number
  categoryName: string
}

export interface CustomerTicketItem {
  id: number
  ticketCode: string
  eventName: string
  ticketTypeName: string
  price: number
  status: 'VALID' | 'USED' | 'CANCELLED'
  bookingTime: string
}
