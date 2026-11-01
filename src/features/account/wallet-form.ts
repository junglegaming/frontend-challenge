import { z } from 'zod'

import { ENS_DOMAINS, ensDomainSchema } from '@/features/checkout/checkout-form'
import {
  type Wallet,
  networkSchema,
  walletAddressSchema,
  walletProviderSchema,
} from '@/shared/contracts'

/** Campos editáveis da carteira (nome, nome do perfil e e-mail vêm do perfil). */
export const walletFormSchema = z.object({
  label: z.string().trim().min(2, 'Informe um apelido (mínimo 2 caracteres).'),
  network: networkSchema,
  address: walletAddressSchema,
  secondaryAddress: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        /^[a-z0-9-]+\.(eth|xyz|id)$/.test(value) ||
        /^0x[a-fA-F0-9]{40}$/.test(value),
      'Use um ENS (ex.: nome.eth) ou um endereço 0x completo.',
    ),
  provider: walletProviderSchema,
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,12}$/, 'Informe o código de indicação (4 a 12 letras ou números).'),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,}$/, 'Use 3 ou mais letras minúsculas, números ou hífen.'),
  ensDomain: ensDomainSchema,
})
export type WalletFormValues = z.infer<typeof walletFormSchema>

/** Separa `nova.eth` em nome e domínio aceitos pelo formulário. */
function splitEns(ensName: string | null): Pick<WalletFormValues, 'ensName' | 'ensDomain'> {
  const domain = ENS_DOMAINS.find((d) => ensName?.endsWith(d))
  if (!ensName || !domain) return { ensName: '', ensDomain: '.eth' }
  return { ensName: ensName.slice(0, -domain.length), ensDomain: domain }
}

/**
 * Valores iniciais do formulário a partir da carteira (edição) ou vazios
 * (cadastro).
 *
 * @param wallet - Carteira em edição, ou `null` para uma nova.
 * @returns Valores padrão do formulário.
 */
export function walletFormDefaults(wallet: Wallet | null): WalletFormValues {
  const network = networkSchema.safeParse(wallet?.network)
  return {
    label: wallet?.label ?? '',
    network: network.success ? network.data : 'Ethereum',
    address: wallet?.address ?? '',
    secondaryAddress: '',
    provider: wallet?.provider ?? 'coinbase',
    referralCode: wallet?.referralCode ?? '',
    ...splitEns(wallet?.ensName ?? null),
  }
}
