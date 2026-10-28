export interface ReportSummary {
  totalRevenue: number
  formattedTotalRevenue: string
  netRevenue: number
  formattedNetRevenue: string
  platformFee: number
  formattedPlatformFee: string
  totalOrders: number
  totalTicketsSold: number
  totalTicketsCapacity: number
  fillRate: number
  formattedFillRate: string
  totalCheckedIn: number
  checkinRate: number
  formattedCheckinRate: string
  averageOrderValue: number
  formattedAverageOrderValue: string
  totalRefundAmount: number
  formattedTotalRefundAmount: string
}

export interface TimeSeriesPoint {
  dateKey: string
  dateLabel: string
  revenue: number
  formattedRevenue: string
  ordersCount: number
  ticketsSold: number
}

export interface EventReportItem {
  eventId: number
  eventName: string
  categoryName: string
  status: string
  startTime: string | null
  endTime: string | null
  venueName: string
  totalCapacity: number
  soldTickets: number
  remainingTickets: number
  fillRate: number
  revenue: number
  formattedRevenue: string
  checkedInTickets: number
  checkinRate: number
}

export interface TicketTypeReportItem {
  ticketTypeId: number
  ticketName: string
  eventName: string
  price: number
  formattedPrice: string
  totalQuantity: number
  soldQuantity: number
  remainingQuantity: number
  salesRate: number
  revenue: number
  formattedRevenue: string
  revenueShare: number
}

export interface OrderStatusReportItem {
  status: string
  statusLabel: string
  orderCount: number
  totalAmount: number
  formattedTotalAmount: string
  percentage: number
}

export interface CategoryReportItem {
  categoryId: number
  categoryName: string
  eventCount: number
  soldTickets: number
  revenue: number
  formattedRevenue: string
  revenueShare: number
}

export interface OrganizerReportData {
  summary: ReportSummary
  timeSeries: TimeSeriesPoint[]
  events: EventReportItem[]
  ticketTypes: TicketTypeReportItem[]
  orderStatuses: OrderStatusReportItem[]
  categories: CategoryReportItem[]
}

export interface EventFilterOption {
  id: number
  name: string
  status: string
  startTime: string | null
}

export interface ReportQueryParams {
  eventId?: number | ''
  timeRange?: string
  startDate?: string
  endDate?: string
}
