import { get } from '../../../lib/http-client'
import type { 
  PublicEventListResponse, 
  PublicEventDetailResponse, 
  CategoryResponse 
} from '../types/event'

export async function getPublicEvents(params: {
  page?: number
  size?: number
  search?: string
  categoryId?: number
  city?: string
  fromDate?: string
  toDate?: string
}): Promise<PublicEventListResponse> {
  const queryParams = new URLSearchParams()
  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.size !== undefined) queryParams.append('size', params.size.toString())
  if (params.search) queryParams.append('search', params.search)
  if (params.categoryId !== undefined) queryParams.append('categoryId', params.categoryId.toString())
  if (params.city) queryParams.append('city', params.city)
  if (params.fromDate) queryParams.append('fromDate', params.fromDate)
  if (params.toDate) queryParams.append('toDate', params.toDate)

  const queryString = queryParams.toString()
  const endpoint = `/public/events${queryString ? `?${queryString}` : ''}`
  
  return get<PublicEventListResponse>(endpoint)
}

export async function getPublicEventDetail(eventId: number): Promise<PublicEventDetailResponse> {
  return get<PublicEventDetailResponse>(`/public/events/${eventId}`)
}

export async function getCategories(): Promise<CategoryResponse[]> {
  return get<CategoryResponse[]>('/categories')
}
