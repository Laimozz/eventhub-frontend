import { get } from '../../../lib/http-client'
import type { 
  PublicEventListResponse, 
  PublicEventDetailResponse, 
  PublicEventSummaryResponse,
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

export interface UserInteractionPayload {
  userId?: number | null
  eventId: number
  actionType: string // 'VIEW', 'CLICK', 'SEARCH_CLICK'
  dwellSeconds?: number
  recLogId?: number | null
}

export interface AiRecommendationResponse {
  rec_log_id: number | null
  user_id: number | null
  strategy: string
  history_interaction_count: number
  recommended_event_ids: number[]
  cards: PublicEventSummaryResponse[]
}

export async function recordEventInteraction(payload: UserInteractionPayload): Promise<void> {
  // Tạm thời comment gọi API tương tác vì hệ thống AI đang bảo trì sửa chữa
  /*
  try {
    await fetch('/api/public/events/interactions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Protection': '1'
      },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    console.warn('Ghi nhận tương tác sự kiện thất bại:', err)
  }
  */
  void payload
}

export async function getRecommendedEvents(userId?: number | null, topK: number = 10): Promise<AiRecommendationResponse> {
  // Tạm thời comment gọi API gợi ý vì hệ thống AI đang bảo trì sửa chữa
  /*
  const effectiveUserId = userId && userId > 0 ? userId : 0
  const response = await fetch(`/ai/recommend/${effectiveUserId}?top_k=${topK}`)
  if (!response.ok) {
    throw new Error(`AI recommendation failed: ${response.status}`)
  }
  return response.json()
  */
  void topK
  return {
    rec_log_id: null,
    user_id: userId ?? null,
    strategy: 'MAINTENANCE',
    history_interaction_count: 0,
    recommended_event_ids: [],
    cards: []
  }
}
