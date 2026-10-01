export type RegistrationRole = 'CUSTOMER' | 'ORGANIZER'

export interface User {
  id: number
  email: string
  fullName: string | null
  phone: string | null
  role: RegistrationRole | 'ADMIN' | 'STAFF'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  fullName: string
  phone: string | null
  role: RegistrationRole
}
