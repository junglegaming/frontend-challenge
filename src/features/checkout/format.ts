import type { Wallet } from '@/shared/contracts'

/**
 * Nome exibido de uma carteira cadastrada.
 *
 * @param wallet - Carteira do usuário.
 * @returns Rótulo dado pelo usuário, ou o papel da carteira.
 * @example
 * walletDisplayName({ label: null, isPrimary: false, ... }) // 'Secundária'
 */
export function walletDisplayName(wallet: Wallet): string {
  return wallet.label ?? (wallet.isPrimary ? 'Principal' : 'Secundária')
}

/**
 * Identificador de token exibido a partir do id do NFT (simulação).
 *
 * @param nftId - Id do NFT, ex.: `nft-7`.
 * @returns Ex.: `#0007`.
 */
export function formatTokenId(nftId: string): string {
  return `#${nftId.replace(/\D/g, '').padStart(4, '0')}`
}

/**
 * Endereço encurtado para exibição (início e fim).
 *
 * @param address - Endereço completo ou já curto.
 * @returns Ex.: `0x7aB8…9f3D`.
 */
export function shortAddress(address: string): string {
  if (address.length <= 13) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
