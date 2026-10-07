import { ApiError } from '../../../lib/http-client';

interface ApiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
  errors?: Record<string, string>;
}

export function userErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const errorData = error.data as ApiErrorResponse | undefined;
    if (errorData?.code === 'EMAIL_ALREADY_EXISTS') {
      return errorData.message || 'Email này đã được sử dụng bởi tài khoản khác. Vui lòng chọn email khác.';
    }
    if (errorData?.code === 'VALIDATION_ERROR' && errorData.errors) {
      const firstError = Object.values(errorData.errors)[0];
      if (firstError) return firstError;
    }
    switch (error.status) {
      case 400: return errorData?.message || 'Thông tin không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.';
      case 401: return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403: return 'Bạn không có quyền thực hiện thao tác này.';
      case 404: return 'Không tìm thấy thông tin tài khoản người dùng.';
      case 409: return 'Email này đã được sử dụng bởi tài khoản khác. Vui lòng chọn email khác.';
      default: return errorData?.message || 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau.';
    }
  }
  return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
}

export function userFieldErrors(error: unknown): Record<string, string> | null {
  if (error instanceof ApiError) {
    const errorData = error.data as ApiErrorResponse | undefined;
    if (errorData?.errors && Object.keys(errorData.errors).length > 0) {
      return errorData.errors;
    }
  }
  return null;
}
