import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/http'
import type { LoginRequest, Session, SignupRequest } from '../model/contracts'

export const sessionKeys = {
  all: (token: string | null) => ['session', token] as const,
}

export const authApi = {
  login: (body: LoginRequest) => api.post<Session, LoginRequest>('/auth/login', body),
  signup: (body: SignupRequest) => api.post<Session, SignupRequest>('/auth/signup', body),
  logout: () => api.post<void>('/auth/logout'),
  session: (signal?: AbortSignal) => api.get<Session>('/session', { signal }),
}

export const sessionQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: sessionKeys.all(token),
    queryFn: ({ signal }) => authApi.session(signal),
    enabled: token !== null,
    staleTime: 60_000,
  })
