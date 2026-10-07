export interface Profile {
  id: string
  name: string
  username: string
  email: string
  bio: string
  avatarUrl: string | null
  updatedAt: string
}

export interface UpdateProfileRequest {
  name: string
  username: string
  email: string
  bio: string
}

export interface UpdateAvatarRequest {
  /** `data:image/png|jpeg|webp;base64,...`, max 1 MB. */
  dataUrl: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
