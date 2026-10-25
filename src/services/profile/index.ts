import { api } from '@/api/client'
import { profileSchema, type ChangePasswordInput, type Profile, type UpdateProfileInput } from '@/schemas/profile'

export const profileService = {
  async get(signal?: AbortSignal): Promise<Profile> {
    const { data } = await api.get('/profile', { signal })
    return profileSchema.parse(data)
  },
  async update(input: UpdateProfileInput): Promise<Profile> {
    const { data } = await api.patch('/profile', input)
    return profileSchema.parse(data)
  },
  async changePassword(input: ChangePasswordInput): Promise<void> {
    await api.post('/profile/password', input)
  },
}
