import { Navigate, Route, Routes } from 'react-router'
import { UserDetailPage } from '../pages/UserDetailPage'
import { PlaceholderPage } from '../../../pages/PlaceholderPage'

export function CustomerRoutes() {
  return (
    <Routes>
      {/* Hồ sơ cá nhân: /customer hoặc /customer/profile */}
      <Route index element={<UserDetailPage />} />
      <Route path="profile" element={<UserDetailPage />} />

      {/* Các tính năng thành viên */}
      <Route path="ve-cua-toi" element={<PlaceholderPage title="Giao diện Vé của tôi" />} />
      <Route path="booking-cua-toi" element={<PlaceholderPage title="Giao diện Booking của tôi" />} />
      <Route path="thong-bao" element={<PlaceholderPage title="Giao diện Thông báo" />} />
      <Route path="kham-pha" element={<PlaceholderPage title="Giao diện Khám phá" />} />
      <Route path="danh-muc" element={<PlaceholderPage title="Giao diện Danh mục" />} />

      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}
