import { ApiError } from '../../../lib/http-client'

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400: return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.'
      case 401: return 'Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.'
      case 403: return 'Yêu cầu bị từ chối. Vui lòng tải lại trang và thử lại.'
      case 409: return 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.'
      case 429: return 'Bạn đã thử quá nhiều lần. Vui lòng chờ một chút rồi thử lại.'
      default: return 'Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau.'
    }
  }
  return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
}
