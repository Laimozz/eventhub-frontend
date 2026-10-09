import { Navigate, Route, Routes } from 'react-router'
import { OrganizerLayout } from '../pages/OrganizerLayout'
import { OrganizerDashboard } from '../pages/OrganizerDashboard'
import { CreateEventPage } from '../../events/pages/CreateEventPage'
import { OrganizerEventsPage } from '../../events/pages/OrganizerEventsPage'
import { EventDetailPage } from '../../events/pages/EventDetailPage'
import { EditEventPage } from '../../events/pages/EditEventPage'

export function OrganizerRoutes() {
  return (
    <Routes>
      <Route element={<OrganizerLayout />}>
        <Route index element={<OrganizerDashboard />} />
        <Route path="events/new" element={<Navigate to="details" replace />} />
        <Route path="events/new/:step" element={<CreateEventPage />} />
        <Route path="events" element={<OrganizerEventsPage />} />
        <Route path="events/:eventId" element={<EventDetailPage />} />
        <Route path="events/:eventId/edit" element={<Navigate to="details" replace />} />
        <Route path="events/:eventId/edit/:step" element={<EditEventPage />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  )
}
