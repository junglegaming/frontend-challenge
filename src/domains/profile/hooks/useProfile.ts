import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAuthToken } from '@/shared/api/auth-token'
import { profileApi, profileKeys, profileQueryOptions } from '../api/profile'
import type { Profile } from '../model/contracts'

export function useProfile() {
  return useQuery(profileQueryOptions(getAuthToken()))
}

/** Every mutation returns the fresh profile, so we write it straight into the cache. */
function useProfileMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Profile>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.all(getAuthToken()), profile),
  })
}

export const useUpdateProfile = () => useProfileMutation(profileApi.update)
export const useUpdateAvatar = () => useProfileMutation(profileApi.updateAvatar)
export const useRemoveAvatar = () => useProfileMutation(profileApi.removeAvatar)

export function useChangePassword() {
  return useMutation({ mutationFn: profileApi.changePassword })
}
