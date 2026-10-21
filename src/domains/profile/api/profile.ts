import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/http'
import type { ChangePasswordRequest, Profile, UpdateAvatarRequest, UpdateProfileRequest } from '../model/contracts'

/** Keyed by the session token so a user switch never reads another user's cached profile. */
export const profileKeys = {
  all: (token: string | null) => ['profile', token] as const,
}

export const profileApi = {
  get: (signal?: AbortSignal) => api.get<Profile>('/profile', { signal }),
  update: (body: UpdateProfileRequest) => api.patch<Profile, UpdateProfileRequest>('/profile', body),
  updateAvatar: (body: UpdateAvatarRequest) => api.put<Profile, UpdateAvatarRequest>('/profile/avatar', body),
  removeAvatar: () => api.delete<Profile>('/profile/avatar'),
  changePassword: (body: ChangePasswordRequest) => api.post<void, ChangePasswordRequest>('/profile/password', body),
}

export const profileQueryOptions = (token: string | null) =>
  queryOptions({
    queryKey: profileKeys.all(token),
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: token !== null,
  })
