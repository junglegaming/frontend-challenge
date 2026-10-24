export const ENS_TLDS = ['.eth', '.xyz', '.art'] as const
export type EnsTld = (typeof ENS_TLDS)[number]

export interface Profile {
  id: string
  name: string
  username: string
  email: string
  bio: string
  /** ENS label without the TLD, e.g. `ana` for `ana.eth`. Empty when not set. */
  ensName: string
  ensTld: EnsTld
  walletNickname: string
  avatarUrl: string | null
  updatedAt: string
}

export interface UpdateProfileRequest {
  name: string
  username: string
  email: string
  bio: string
  ensName: string
  ensTld: EnsTld
  walletNickname: string
}

export interface UpdateAvatarRequest {
  /** `data:image/png|jpeg|webp;base64,...`, max 1 MB. */
  dataUrl: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
