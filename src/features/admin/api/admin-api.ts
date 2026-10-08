import axios from 'axios'
import { ApiError, httpClient } from '../../../lib/http-client'
import type { AdminUser, Category, PageResult, PendingEvent, ReviewDetail } from '../types/admin'

export const adminApi = {
  users: (query: string, signal?: AbortSignal) => httpClient.get<PageResult<AdminUser>>('/admin/users?' + query, { signal }).then(r => r.data),
  createUser: (body: { fullName: string; email: string; phone: string; password: string; role: string }) => httpClient.post('/admin/users', body),
  status: (id: number, status: string) => httpClient.patch('/admin/users/' + id + '/status', { status }),
  categories: (query: string, signal?: AbortSignal) => httpClient.get<PageResult<Category>>('/admin/event-categories?' + query, { signal }).then(r => r.data),
  saveCategory: (body: { name: string; description: string }, id?: number) => id
    ? httpClient.put('/admin/event-categories/' + id, body) : httpClient.post('/admin/event-categories', body),
  deleteCategory: (id: number) => httpClient.delete('/admin/event-categories/' + id),
  pending: (query: string, signal?: AbortSignal) => httpClient.get<PageResult<PendingEvent>>('/admin/events/pending' + (query ? '?' + query : ''), { signal }).then(r => r.data),
  detail: (id: string, signal?: AbortSignal) => httpClient.get<ReviewDetail>('/admin/events/pending/' + id, { signal }).then(r => r.data),
  approve: (id: number, version: number) => httpClient.post('/admin/events/' + id + '/approve', { version }),
  reject: (id: number, version: number, reason: string) => httpClient.post('/admin/events/' + id + '/reject', { version, reason }),
}
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError) && !axios.isAxiosError(error)) return 'Có lỗi xảy ra. Vui lòng thử lại.'
  const status = error instanceof ApiError ? error.status : error.response?.status
  const data = (error instanceof ApiError ? error.data : error.response?.data) as { message?: string; errors?: Record<string, string>; code?: string } | undefined
  const messages: Record<string, string> = {
    EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng.', CATEGORY_NAME_ALREADY_EXISTS: 'Tên danh mục đã tồn tại.',
    CATEGORY_IN_USE: 'Danh mục đang được sử dụng, không thể xóa.', CANNOT_LOCK_SELF: 'Không thể khóa chính tài khoản của bạn.',
    EVENT_VERSION_CONFLICT: 'Nội dung sự kiện đã thay đổi. Vui lòng tải lại để xem trước khi quyết định.',
    EVENT_NOT_PENDING: 'Sự kiện không còn chờ duyệt. Vui lòng quay lại danh sách.',
  }
  if (data?.code && messages[data.code]) return messages[data.code]
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy dữ liệu.'
  if (status === 400) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.'
  if (status === 409) return 'Dữ liệu bị trùng hoặc đã thay đổi. Vui lòng tải lại.'
  return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
}
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) && !axios.isAxiosError(error)) return {}
  const errors = (error instanceof ApiError ? error.data?.errors : error.response?.data?.errors) as Record<string, string> | undefined
  return Object.fromEntries(Object.keys(errors ?? {}).map(key => [key, 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.']))
}
