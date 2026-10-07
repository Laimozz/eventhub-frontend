import { Navigate, Route, Routes } from 'react-router'
import { StaffPage } from '../pages/StaffPage'

export function StaffRoutes() {
  return (
    <Routes>
      <Route index element={<StaffPage />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}
