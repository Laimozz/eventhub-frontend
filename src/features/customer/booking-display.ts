import { ApiError } from '../../lib/http-client'

export const utcDate = (value: string) => new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`)
export const formatBookingDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(utcDate(value))
export const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)} ₫`
export const bookingCode = (id: number) => `EH-${String(id).padStart(6, '0')}`
export const validId = (value: string | undefined) => value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null

export function bookingError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    if (error.status === 403) return 'Bạn không có quyền sử dụng tính năng này.'
    if (error.status === 404) return 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập.'
    if (error.status === 503) return 'Cổng VNPay chưa sẵn sàng. Vui lòng thử lại sau hoặc liên hệ ban tổ chức.'
    const message = typeof error.data?.message === 'string' ? error.data.message : ''
    if (message.includes('Not enough tickets')) return 'Số vé còn lại không đủ. Vui lòng chọn lại số lượng.'
    if (message.includes('not on sale')) return 'Loại vé này chưa mở bán hoặc đã đóng bán.'
    if (message.includes('already paid, expired')) return 'Booking đã thanh toán hoặc hết thời gian giữ vé.'
    if (message.includes('Event is not approved')) return 'Sự kiện hiện không mở bán vé.'
    if (message.includes('signature')) return 'Không thể xác thực kết quả VNPay. Vui lòng xem trạng thái trong lịch sử booking.'
    return message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.'
  }
  return error instanceof Error && error.message === 'URL thanh toán không hợp lệ.' ? error.message : 'Không thể kết nối máy chủ. Vui lòng thử lại.'
}
