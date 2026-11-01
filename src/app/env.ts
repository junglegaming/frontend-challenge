import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().default('/api'),
  VITE_SOCKET_URL: z.string().default(''),
  VITE_ENABLE_MOCKS: z.string().default('true'),
})

const parsed = envSchema.safeParse(import.meta.env)
if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas: ${JSON.stringify(parsed.error.format(), null, 2)}`,
  )
}

/**
 * Variáveis de ambiente validadas. Importado por `mount.tsx` para falhar cedo
 * com configuração inválida; a flag de mocks do boot vive em `mocks-flag.ts`.
 */
export const env = parsed.data
