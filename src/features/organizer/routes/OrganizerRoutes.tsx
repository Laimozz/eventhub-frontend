import { Navigate, Route, Routes } from 'react-router'
import { OrganizerLayout } from '../pages/OrganizerLayout'
import { OrganizerDashboard } from '../pages/OrganizerDashboard'
import { CreateEventPage } from '../../events/pages/CreateEventPage'

export function OrganizerRoutes() {
  return (
    <Routes>
      <Route element={<OrganizerLayout />}>
        <Route index element={<OrganizerDashboard />} />
        <Route path="events/new" element={<Navigate to="details" replace />} />
        <Route path="events/new/:step" element={<CreateEventPage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  )
}
