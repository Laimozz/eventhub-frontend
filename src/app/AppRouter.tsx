import { Navigate, Outlet, Route, Routes } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { HomePage } from '../pages/HomePage'
import { OrganizerLayout } from '../features/organizer/pages/OrganizerLayout'
import { OrganizerDashboard } from '../features/organizer/pages/OrganizerDashboard'
import { CreateEventPage } from '../features/events/pages/CreateEventPage'
import { OrganizerEventsPage } from '../features/events/pages/OrganizerEventsPage'
import { EventDetailPage } from '../features/events/pages/EventDetailPage'
import { EditEventPage } from '../features/events/pages/EditEventPage'

function GuestRoute() {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : <Outlet />
}

function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function OrganizerRoute() {
  const { user } = useAuth()
  return user?.role === 'ORGANIZER' ? <Outlet /> : <Navigate to="/" replace />
}

function LandingPage() {
  const { user } = useAuth()
  return user?.role === 'ORGANIZER' ? <Navigate to="/organizer" replace /> : <HomePage />
}

export function AppRouter() {
  const { loading } = useAuth()
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>

  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route index element={<LandingPage />} />
        <Route element={<OrganizerRoute />}>
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route index element={<OrganizerDashboard />} />
            <Route path="events/new" element={<Navigate to="details" replace />} />
            <Route path="events/new/:step" element={<CreateEventPage />} />
            <Route path="events" element={<OrganizerEventsPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
            <Route path="events/:eventId/edit" element={<Navigate to="details" replace />} />
            <Route path="events/:eventId/edit/:step" element={<EditEventPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
