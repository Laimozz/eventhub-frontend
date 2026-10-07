import { httpClient } from '../../../lib/http-client'
import { toRequest } from '../event-form'
import type { Category, CreatedEvent, EventDraft } from '../types/event'

export async function getCategories(signal?: AbortSignal) {
  return (await httpClient.get<Category[]>('/categories', { signal })).data
}
export async function createEvent(draft: EventDraft) {
  const body = new FormData()
  body.append('event', new Blob([JSON.stringify(toRequest(draft))], { type: 'application/json' }), 'event.json')
  if (draft.bannerImage) body.append('bannerImage', draft.bannerImage)
  if (draft.thumbnailImage) body.append('thumbnailImage', draft.thumbnailImage)
  if (draft.imageZone) body.append('imageZone', draft.imageZone)
  draft.ticketTypes.forEach((ticket, index) => { if (ticket.imageFile) body.append(`ticketImage${index}`, ticket.imageFile) })
  draft.guests.forEach((guest, index) => { if (guest.imageFile) body.append(`guestImage${index}`, guest.imageFile) })
  return (await httpClient.post<CreatedEvent>('/events', body)).data
}
