import { z } from 'zod'

/** Só caminhos internos ("/..."), nunca "//host" ou URLs absolutas (open redirect). */
export function isInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//')
}

export const redirectSearchSchema = z.object({
  redirect: z
    .string()
    .refine(isInternalPath, 'redirect inválido')
    .optional()
    .catch(undefined),
})
