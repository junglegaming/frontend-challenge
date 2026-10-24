export type UserRole = 'collector' | 'admin'

export interface SessionUser {
  id: string
  name: string
  email: string
  username: string
  avatarUrl: string | null
  role: UserRole
}

export interface Session {
  token: string
  user: SessionUser
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  username: string
  email: string
  password: string
}
