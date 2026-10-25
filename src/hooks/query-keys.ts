import type { NftListParams } from '@/schemas/nft'

/** Chaves privadas carregam o userId: dados de um usuário nunca aparecem para outro. */
export const queryKeys = {
  session: ['session'] as const,
  nftLists: ['nfts'] as const,
  nfts: (params: NftListParams) => ['nfts', params] as const,
  nft: (nftId: string) => ['nft', nftId] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  cart: (owner: string) => ['cart', owner] as const,
  order: (userId: string, orderId: string) => ['order', userId, orderId] as const,
  orders: (userId: string) => ['order', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  wallets: (userId: string) => ['wallets', userId] as const,
}
