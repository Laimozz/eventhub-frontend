import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'

// Organizer Pages & Layout
import { OrganizerLayout } from '../features/organizer/pages/OrganizerLayout'
import { OrganizerDashboard } from '../features/organizer/pages/OrganizerDashboard'
import { OrganizerStaffDispatchPage } from '../features/organizer/pages/OrganizerStaffDispatchPage'
import { OrganizerWalletPage } from '../features/organizer/pages/OrganizerWalletPage'
import { OrganizerReportsPage } from '../features/organizer/pages/OrganizerReportsPage'
import { OrganizerBookingsPage } from '../features/organizer/pages/OrganizerBookingsPage'
import { CreateEventPage } from '../features/events/pages/CreateEventPage'
import { OrganizerEventsPage } from '../features/events/pages/OrganizerEventsPage'
import { EventDetailPage } from '../features/events/pages/EventDetailPage'
import { EditEventPage } from '../features/events/pages/EditEventPage'
import { UserDetailPage as OrganizerUserDetailPage } from '../features/organizer/pages/UserDetailPage'

// Admin Pages & Layout
import { AdminLayout } from '../features/admin/pages/AdminLayout'
import { AdminPage } from '../features/admin/pages/AdminPage'
import { WithdrawalsPage } from '../features/admin/pages/WithdrawalsPage'
import { WithdrawalDetailPage } from '../features/admin/pages/WithdrawalDetailPage'
import { RefundEventsPage } from '../features/admin/pages/RefundEventsPage'
import { RefundDetailPage } from '../features/admin/pages/RefundDetailPage'
import { UsersPage } from '../features/admin/pages/UsersPage'
import { EventCategoriesPage } from '../features/admin/pages/EventCategoriesPage'
import { PendingEventsPage } from '../features/admin/pages/PendingEventsPage'
import { EventReviewDetailPage } from '../features/admin/pages/EventReviewDetailPage'
import { UserDetailPage as AdminUserDetailPage } from '../features/admin/pages/UserDetailPage'

// Notifications
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage'

// Feature Sub-Routers
import { StaffRoutes } from '../features/staff/routes/StaffRoutes'
import { CustomerRoutes } from '../features/customer/routes/CustomerRoutes'

function GuestRoute() {
  const { user } = useAuth()
  const location = useLocation()
  const from = location.state?.from
  const destination =
    (user?.role === 'CUSTOMER' || user?.role === 'STAFF') &&
    typeof from === 'string' &&
    (from.startsWith('/customer/') || from.startsWith('/staff'))
      ? from
      : '/'
  return user ? <Navigate to={destination} replace /> : <Outlet />
}

function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}

function OrganizerRoute() {
  const { user } = useAuth()
  return user?.role === 'ORGANIZER' ? <Outlet /> : <Navigate to="/" replace />
}

function StaffRoute() {
  const { user } = useAuth()
  return user?.role === 'STAFF' ? <Outlet /> : <Navigate to="/" replace />
}

function LandingPage() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') return <Navigate to="/admin/events/pending" replace />
  if (user?.role === 'ORGANIZER') return <Navigate to="/organizer" replace />
  // Role STAFF, CUSTOMER hoặc người dùng chưa đăng nhập đều về cổng customer
  return <Navigate to="/customer" replace />
}

export function AppRouter() {
  const { loading } = useAuth()
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>

  return (
    <Routes>
      {/* Auth Portal */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Public / Generic Entry */}
      <Route path="/" element={<LandingPage />} />

      {/* Protected Area */}
      <Route element={<ProtectedRoute />}>
        {/* Admin Portal */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="notifications" element={<NotificationsPage />} />
            <Route index element={<Navigate to="events/pending" replace />} />
            <Route path="statistics" element={<AdminPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="withdrawals/:requestId" element={<WithdrawalDetailPage />} />
            <Route path="refunds" element={<RefundEventsPage />} />
            <Route path="refunds/:eventId" element={<RefundDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="event-categories" element={<EventCategoriesPage />} />
            <Route path="events/pending" element={<PendingEventsPage />} />
            <Route path="events/pending/:eventId" element={<EventReviewDetailPage />} />
            <Route path="profile" element={<AdminUserDetailPage />} />
          </Route>
        </Route>

        {/* Organizer Portal */}
        <Route element={<OrganizerRoute />}>
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route path="notifications" element={<NotificationsPage />} />
            <Route index element={<OrganizerDashboard />} />
            <Route path="events/new" element={<Navigate to="details" replace />} />
            <Route path="events/new/:step" element={<CreateEventPage />} />
            <Route path="events" element={<OrganizerEventsPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
            <Route path="events/:eventId/edit" element={<Navigate to="details" replace />} />
            <Route path="events/:eventId/edit/:step" element={<EditEventPage />} />
            <Route path="staffs" element={<OrganizerStaffDispatchPage />} />
            <Route path="bookings" element={<OrganizerBookingsPage />} />
            <Route path="reports" element={<OrganizerReportsPage />} />
            <Route path="wallet" element={<OrganizerWalletPage />} />
            <Route path="profile" element={<OrganizerUserDetailPage />} />
          </Route>
        </Route>

        {/* Staff Portal */}
        <Route element={<StaffRoute />}>
          <Route path="/staff/*" element={<StaffRoutes />} />
        </Route>
      </Route>

      {/* Customer Portal (Public access allowed) */}
      <Route path="/customer/*" element={<CustomerRoutes />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
