import { UserDetailPage as BaseUserDetailPage } from '../../customer/pages/UserDetailPage'
import { StaffHeader } from '../components/StaffHeader'

export function StaffProfilePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fc' }}>
      <StaffHeader />
      <main style={{ flex: 1 }}>
        <BaseUserDetailPage hideNav={true} />
      </main>
    </div>
  )
}
