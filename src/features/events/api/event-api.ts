import { httpClient } from '../../../lib/http-client'
import { toRequest } from '../event-form'
import type { Category, CreatedEvent, EventDetail, EventDraft, EventList, EventStatus } from '../types/event'

export async function getCategories(signal?: AbortSignal) {
  return (await httpClient.get<Category[]>('/categories', { signal })).data
}
function eventBody(draft: EventDraft, editing = false) {
  const body = new FormData()
  const request = toRequest(draft)
  const payload = editing ? { ...request, removeImageZone: Boolean(draft.removeImageZone),
    ticketTypes: request.ticketTypes.map((ticket, index) => ({ ...ticket, id: draft.ticketTypes[index].id })),
    guests: request.guests.map((guest, index) => ({ ...guest, id: draft.guests[index].id, removeImage: Boolean(draft.guests[index].removeImage) })),
  } : request
  body.append('event', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'event.json')
  if (draft.bannerImage) body.append('bannerImage', draft.bannerImage)
  if (draft.thumbnailImage) body.append('thumbnailImage', draft.thumbnailImage)
  if (draft.imageZone) body.append('imageZone', draft.imageZone)
  draft.ticketTypes.forEach((ticket, index) => { if (ticket.imageFile) body.append(`ticketImage${index}`, ticket.imageFile) })
  draft.guests.forEach((guest, index) => { if (guest.imageFile) body.append(`guestImage${index}`, guest.imageFile) })
  return body
}
export async function createEvent(draft: EventDraft) {
  return (await httpClient.post<CreatedEvent>('/events', eventBody(draft), { timeout: 180_000 })).data
}
export async function getOrganizerEvents(params: { page: number; size: number; search: string; status?: EventStatus }, signal?: AbortSignal) {
  return (await httpClient.get<EventList>('/events/mine', { params, signal })).data
}
export async function getEvent(id: number, signal?: AbortSignal) {
  return (await httpClient.get<EventDetail>(`/events/${id}`, { signal })).data
}
export async function updateEvent(id: number, draft: EventDraft) {
  return (await httpClient.put<EventDetail>(`/events/${id}`, eventBody(draft, true), { timeout: 180_000 })).data
}
export async function cancelEvent(id: number, reason: string) {
  return (await httpClient.post<EventDetail>(`/events/${id}/cancel`, { reason: reason.trim() })).data
}
