export interface SessionUser {
  id: string
  name: string
  email: string
  username: string
  avatarUrl: string | null
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
