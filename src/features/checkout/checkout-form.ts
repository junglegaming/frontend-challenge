import { z } from 'zod'

import type { WalletProvider } from '@/shared/contracts'

/** Provedores oferecidos no checkout, com o rótulo exibido. */
export const WALLET_PROVIDER_LABELS = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
} as const satisfies Record<WalletProvider, string>

export const ENS_DOMAINS = ['.eth', '.xyz', '.id'] as const
export const ensDomainSchema = z.enum(ENS_DOMAINS)

/**
 * Campos do "Perfil do colecionador" no checkout desktop. Obrigatórios seguem
 * os asteriscos do layout; formatos seguem as convenções de cada campo.
 * Carteira, rede e provedor ficam no estado do checkout (compartilhado com o
 * layout mobile), não neste formulário.
 */
export const collectorFormSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição (mínimo 2 caracteres).'),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9._]{3,20}$/, 'Use 3 a 20 letras minúsculas, números, ponto ou _.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil (mínimo 2 caracteres).'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  secondaryWallet: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        /^[a-z0-9-]+\.(eth|xyz|id)$/.test(value) ||
        /^0x[a-fA-F0-9]{6,}$/.test(value),
      'Use um ENS (ex.: nome.eth) ou um endereço 0x.',
    ),
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,12}$/, 'Informe o código de indicação (4 a 12 letras ou números).'),
  ensDomain: ensDomainSchema,
  collectorNote: z.string().max(280, 'Use no máximo 280 caracteres.'),
})
export type CollectorForm = z.infer<typeof collectorFormSchema>
