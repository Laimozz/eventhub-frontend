import { Navigate, Outlet, Route, Routes } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { HomePage } from '../pages/HomePage'
import { AdminPage } from '../features/admin/pages/AdminPage'
import { CustomerPage } from '../features/customer/pages/CustomerPage'
import { OrganizerPage } from '../features/organizer/pages/OrganizerPage'
import { StaffPage } from '../features/staff/pages/StaffPage'

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
        
        <Route path="/customer" element={<CustomerPage />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route element={<OrganizerRoute />}>
          <Route path="/organizer" element={<OrganizerPage />} />
        </Route>

        <Route element={<StaffRoute />}>
          <Route path="/staff" element={<StaffPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
