import { api } from '@/api/client'
import { authResponseSchema, sessionResponseSchema, type AuthResponse, type LoginInput, type RegisterInput, type User } from '@/schemas/auth'

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', input)
    return authResponseSchema.parse(data)
  },
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', input)
    return authResponseSchema.parse(data)
  },
  async getSession(signal?: AbortSignal): Promise<User> {
    const { data } = await api.get('/auth/session', { signal })
    return sessionResponseSchema.parse(data).user
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
