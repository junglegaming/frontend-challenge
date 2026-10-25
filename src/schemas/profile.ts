import { z } from 'zod'
import { passwordSchema, usernameSchema } from './auth'
import { ensNameSchema } from './wallet'

export const profileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatar: z.string().nullable(),
})
export type Profile = z.infer<typeof profileSchema>

const AVATAR_MAX_BYTES = 1024 * 1024

export const avatarSchema = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp|gif);base64,/, 'Formato de imagem inválido')
  .refine((value) => (value.length * 3) / 4 <= AVATAR_MAX_BYTES + 128, 'Imagem acima de 1 MB')

export const updateProfileInputSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição'),
  username: usernameSchema,
  email: z.email('E-mail inválido'),
  ensName: ensNameSchema,
  walletNickname: z.string().trim().min(2, 'Informe o apelido da carteira'),
  avatar: avatarSchema.nullable().optional(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>
