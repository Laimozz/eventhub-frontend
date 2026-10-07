import { Navigate, Outlet, Route, Routes } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { HomePage } from '../pages/HomePage'

// Features
import { AdminPage } from '../features/admin/pages/AdminPage'
import { CustomerPage } from '../features/customer/pages/CustomerPage'
import { StaffPage } from '../features/staff/pages/StaffPage'
import { OrganizerLayout } from '../features/organizer/pages/OrganizerLayout'
import { OrganizerDashboard } from '../features/organizer/pages/OrganizerDashboard'
import { CreateEventPage } from '../features/events/pages/CreateEventPage'

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
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user?.role === 'ORGANIZER') return <Navigate to="/organizer" replace />
  if (user?.role === 'STAFF') return <Navigate to="/staff" replace />
  return <HomePage />
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

        {/* Customer Portal */}
        <Route path="/customer" element={<CustomerPage />} />

        {/* Admin Portal */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Organizer Portal */}
        <Route element={<OrganizerRoute />}>
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route index element={<OrganizerDashboard />} />
            <Route path="events/new" element={<Navigate to="details" replace />} />
            <Route path="events/new/:step" element={<CreateEventPage />} />
          </Route>
        </Route>

        {/* Staff Portal */}
        <Route element={<StaffRoute />}>
          <Route path="/staff" element={<StaffPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
