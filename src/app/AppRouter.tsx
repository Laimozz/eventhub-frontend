import { Navigate, Outlet, Route, Routes } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { HomePage } from '../pages/HomePage'

// Organizer Pages & Layout
import { OrganizerLayout } from '../features/organizer/pages/OrganizerLayout'
import { OrganizerDashboard } from '../features/organizer/pages/OrganizerDashboard'
import { CreateEventPage } from '../features/events/pages/CreateEventPage'
import { OrganizerEventsPage } from '../features/events/pages/OrganizerEventsPage'
import { EventDetailPage } from '../features/events/pages/EventDetailPage'
import { EditEventPage } from '../features/events/pages/EditEventPage'

// Admin Pages & Layout
import { AdminLayout } from '../features/admin/pages/AdminLayout'
import { UsersPage } from '../features/admin/pages/UsersPage'
import { EventCategoriesPage } from '../features/admin/pages/EventCategoriesPage'
import { PendingEventsPage } from '../features/admin/pages/PendingEventsPage'
import { EventReviewDetailPage } from '../features/admin/pages/EventReviewDetailPage'

// Notifications
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage'

// Feature Sub-Routers
import { StaffRoutes } from '../features/staff/routes/StaffRoutes'
import { CustomerRoutes } from '../features/customer/routes/CustomerRoutes'

function GuestRoute() {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : <Outlet />
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
  if (user?.role === 'STAFF') return <Navigate to="/staff" replace />
  return <HomePage />
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

      {/* Protected Area */}
      <Route element={<ProtectedRoute />}>
        <Route index element={<LandingPage />} />

        {/* Admin Portal */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="events/pending" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="event-categories" element={<EventCategoriesPage />} />
            <Route path="events/pending" element={<PendingEventsPage />} />
            <Route path="events/pending/:eventId" element={<EventReviewDetailPage />} />
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
          </Route>
        </Route>

        {/* Staff Portal */}
        <Route element={<StaffRoute />}>
          <Route path="/staff/*" element={<StaffRoutes />} />
        </Route>

        {/* Customer Portal */}
        <Route path="/customer/*" element={<CustomerRoutes />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
