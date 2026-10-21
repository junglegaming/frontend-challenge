import { useQuery } from '@tanstack/react-query'
import type { Network } from '@/domains/wallets'
import { cartQueries } from '../api/queries'

/** The cart page previews totals for a default network; checkout re-requests the quote for the chosen one. */
export const DEFAULT_QUOTE_NETWORK: Network = 'ethereum'

export function useCartQuote(network: Network = DEFAULT_QUOTE_NETWORK) {
  return useQuery(cartQueries.quote(network))
}
