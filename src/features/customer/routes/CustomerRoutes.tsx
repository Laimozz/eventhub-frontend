import { Navigate, Route, Routes } from 'react-router'
import { UserDetailPage } from '../pages/UserDetailPage'
import { PlaceholderPage } from '../../../pages/PlaceholderPage'
import { ExplorePage } from '../pages/ExplorePage'
import { EventDetailPage } from '../pages/EventDetailPage'
import { HomePage } from '../pages/HomePage'

export function CustomerRoutes() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="explore" element={<ExplorePage />} />
      <Route path="events/:eventId" element={<EventDetailPage />} />

      {/* Hồ sơ cá nhân: /customer/profile */}
      <Route path="profile" element={<UserDetailPage />} />

      {/* Các tính năng thành viên */}
      <Route path="ve-cua-toi" element={<PlaceholderPage title="Giao diện Vé của tôi" />} />
      <Route path="booking-cua-toi" element={<PlaceholderPage title="Giao diện Booking của tôi" />} />
      <Route path="thong-bao" element={<PlaceholderPage title="Giao diện Thông báo" />} />
      <Route path="danh-muc" element={<PlaceholderPage title="Giao diện Danh mục" />} />

      <Route path="*" element={<Navigate to="explore" replace />} />
    </Routes>
  )
}
