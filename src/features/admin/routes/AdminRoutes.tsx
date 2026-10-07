import { Navigate, Route, Routes } from 'react-router'
import { AdminPage } from '../pages/AdminPage'

export function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminPage />} />
      {/* Sau này thêm các trang quản trị: user, kiểm duyệt sự kiện, báo cáo... chỉ cần thêm tại đây */}
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}
