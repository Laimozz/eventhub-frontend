import type { User } from './types/auth'

export function getRoleHomePath(role?: User['role'] | null): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'ORGANIZER':
      return '/organizer'
    case 'STAFF':
      return '/staff'
    default:
      return '/customer'
  }
}
