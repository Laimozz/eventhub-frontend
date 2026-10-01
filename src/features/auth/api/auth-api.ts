import { post, refreshSession as refresh } from '../../../lib/http-client'
import type { LoginRequest, RegisterRequest, User } from '../types/auth'

export const register = (body: RegisterRequest) => post<string>('/auth/register', body)
export const login = (body: LoginRequest) => post<User>('/auth/login', body)
export const logout = () => post<void>('/auth/logout')
export const refreshSession = () => refresh<User>()
