import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { SelectTicketsPage } from '../pages/SelectTicketsPage'
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage'
import { BookingHistoryPage } from '../pages/BookingHistoryPage'
import { BookingDetailPage } from '../pages/BookingDetailPage'
import { PaymentResultPage } from '../pages/PaymentResultPage'
import { MyTicketsPage } from '../pages/MyTicketsPage'
import { UserDetailPage } from '../pages/UserDetailPage'
import { PlaceholderPage } from '../../../pages/PlaceholderPage'
import { ExplorePage } from '../pages/ExplorePage'
import { EventDetailPage } from '../pages/EventDetailPage'
import { HomePage } from '../pages/HomePage'
import { CustomerHeader } from '../components/CustomerHeader'
import { CustomerFooter } from '../components/CustomerFooter'
import { NotificationsPage } from '../../notifications/pages/NotificationsPage'

function CustomerMemberRoute() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return user.role === 'CUSTOMER' ? <Outlet /> : <Navigate to="/" replace />
}

export function CustomerRoutes() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="explore" element={<ExplorePage />} />
      <Route path="events/:eventId" element={<EventDetailPage />} />

      {/* Hồ sơ cá nhân: /customer/profile */}
      <Route path="profile" element={<UserDetailPage />} />

      {/* Các tính năng thành viên */}
      <Route path="payment-result" element={<PaymentResultPage />} />
      <Route element={<CustomerMemberRoute />}>
        <Route path="thong-bao" element={<><CustomerHeader /><NotificationsPage standalone /><CustomerFooter /></>} />
        <Route path="events/:eventId/book" element={<SelectTicketsPage />} />
        <Route path="bookings/:bookingId/checkout" element={<BookingCheckoutPage />} />
        <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
        <Route path="bookings/:bookingId/tickets" element={<MyTicketsPage />} />
        <Route path="ve-cua-toi" element={<MyTicketsPage />} />
        <Route path="booking-cua-toi" element={<BookingHistoryPage />} />
      </Route>
      <Route path="danh-muc" element={<PlaceholderPage title="Giao diện Danh mục" />} />

      <Route path="*" element={<Navigate to="explore" replace />} />
    </Routes>
  )
}
