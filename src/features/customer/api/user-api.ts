import { get, post, put } from '../../../lib/http-client';
import type { UpdateUserDetailDto, UserDetailDto } from '../types/user';

export async function getUserDetail(): Promise<UserDetailDto> {
  return get<UserDetailDto>('/users/me');
}

export async function updateUserDetail(payload: UpdateUserDetailDto): Promise<UserDetailDto> {
  return put<UserDetailDto>('/users/me', payload);
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  return put<{ message: string }>('/users/me/password', payload);
}

export interface UploadAvatarResponse {
  avatarUrl: string;
  message: string;
}

export async function uploadAvatar(file: File, userId?: number): Promise<UploadAvatarResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (userId != null) {
    formData.append('userId', String(userId));
  }
  return post<UploadAvatarResponse>('/users/me/avatar', formData);
}

