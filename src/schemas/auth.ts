import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.email(),
  avatar: z.string().nullable(),
})
export type User = z.infer<typeof userSchema>

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo de 8 caracteres')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
  .regex(/\d/, 'Inclua um número')
  .regex(/[^A-Za-z0-9]/, 'Inclua um caractere especial')

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Mínimo de 3 caracteres')
  .max(24, 'Máximo de 24 caracteres')
  .regex(/^[a-z0-9_.]+$/i, 'Use letras, números, ponto ou _')

export const loginInputSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const registerInputSchema = z
  .object({
    username: usernameSchema,
    email: z.email('E-mail inválido'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })
export type RegisterInput = z.infer<typeof registerInputSchema>

export const authResponseSchema = z.object({ user: userSchema, token: z.string() })
export type AuthResponse = z.infer<typeof authResponseSchema>

export const sessionResponseSchema = z.object({ user: userSchema })
