import { z } from 'zod'
import { networkSchema } from './common'

export const walletProviderSchema = z.enum(['metamask', 'walletconnect', 'coinbase'])
export type WalletProvider = z.infer<typeof walletProviderSchema>

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const walletSlotSchema = z.enum(['primary', 'secondary'])
export type WalletSlot = z.infer<typeof walletSlotSchema>

export const addressSchema = z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço 0x inválido (40 caracteres hexadecimais)')
export const ensNameSchema = z.string().trim().regex(/^[a-z0-9-]{3,}$/i, 'Mínimo de 3 caracteres (letras, números ou -)')

/** Campos do formulário "Carteira" (Figma: Carteiras) */
export const walletInputSchema = z.object({
  slot: walletSlotSchema,
  displayName: z.string().trim().min(2, 'Informe o nome de exibição'),
  nickname: z.string().trim().min(2, 'Informe o apelido da carteira'),
  network: networkSchema,
  profileName: z.string().trim().min(2, 'Informe o nome do perfil'),
  address: addressSchema,
  secondaryAddress: z.string().trim().max(64).optional().or(z.literal('')),
  provider: walletProviderSchema,
  referralCode: z.string().trim().min(4, 'Informe o código de indicação'),
  email: z.email('E-mail inválido'),
  ensName: ensNameSchema,
})
export type WalletInput = z.infer<typeof walletInputSchema>

export const walletSchema = walletInputSchema.extend({
  id: z.string(),
  connected: z.boolean(),
  updatedAt: z.string(),
})
export type Wallet = z.infer<typeof walletSchema>

export const walletsResponseSchema = z.object({ wallets: z.array(walletSchema) })
