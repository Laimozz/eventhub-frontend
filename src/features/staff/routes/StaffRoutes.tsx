import { Navigate, Route, Routes } from 'react-router'
import { StaffDashboardPage } from '../pages/StaffDashboardPage'
import { EventDetailPage } from '../pages/EventDetailPage'
import { StaffProfilePage } from '../pages/StaffProfilePage'

export function StaffRoutes() {
  return (
    <Routes>
      <Route index element={<StaffDashboardPage />} />
      <Route path="events/:eventId" element={<EventDetailPage />} />
      <Route path="profile" element={<StaffProfilePage />} />
      <Route path="*" element={<Navigate to="/staff" replace />} />
    </Routes>
  )
}
