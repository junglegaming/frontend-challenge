import type { NftListQuery } from '@/shared/contracts'

/**
 * Fábrica de chaves do TanStack Query. Isolamento por ownerKey acontece nas
 * queries que usam dados privados (favoritos, carrinho, perfil, carteiras).
 */
export const queryKeys = {
  nfts: {
    all: ['nfts'] as const,
    list: (query: NftListQuery) => ['nfts', 'list', query] as const,
    detail: (id: string) => ['nfts', 'detail', id] as const,
    reviews: (id: string) => ['nfts', 'reviews', id] as const,
  },
  favorites: {
    all: (ownerKey: string) => ['favorites', ownerKey] as const,
  },
  cart: {
    all: (ownerKey: string) => ['cart', ownerKey] as const,
  },
  quote: {
    all: ['quote'] as const,
  },
  orders: {
    all: (ownerKey: string) => ['orders', ownerKey] as const,
    detail: (ownerKey: string, id: string) => ['orders', ownerKey, 'detail', id] as const,
  },
  profile: {
    all: (ownerKey: string) => ['profile', ownerKey] as const,
  },
  wallets: {
    all: (ownerKey: string) => ['wallets', ownerKey] as const,
  },
  session: {
    all: ['session'] as const,
  },
} as const
