export type UserRole = 'CUSTOMER' | 'ORGANIZER' | 'STAFF' | 'ADMIN';

export interface UserDetailDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserDetailDto {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  gender?: string | null;
}
