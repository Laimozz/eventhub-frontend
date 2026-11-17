import { httpClient } from '../../../lib/http-client'

export interface Conversation {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface ChatSource { label: string; path: string }
export interface ConversationDetail { conversation: Conversation; messages: ChatMessage[] }
export interface ChatReply {
  conversation: Conversation
  userMessage: ChatMessage
  assistantMessage: ChatMessage
  sources: ChatSource[]
  contextAt: string
}

export async function loadChat(signal?: AbortSignal) {
  const [status, history] = await Promise.all([
    httpClient.get<{ available: boolean }>('/ai/status', { signal }),
    httpClient.get<Conversation[]>('/ai/conversations', { signal }),
  ])
  return { available: status.data.available, history: history.data }
}

export async function loadConversation(id: number, signal?: AbortSignal) {
  return (await httpClient.get<ConversationDetail>(`/ai/conversations/${id}`, { signal })).data
}

export async function sendChat(message: string, conversationId: number | null, signal?: AbortSignal) {
  return (await httpClient.post<ChatReply>('/ai/chat', { message, conversationId }, {
    // Backend allows up to 90 seconds for a configured provider timeout.
    timeout: 100_000, signal,
  })).data
}

export async function deleteConversation(id: number, signal?: AbortSignal) {
  await httpClient.delete(`/ai/conversations/${id}`, { signal })
}
