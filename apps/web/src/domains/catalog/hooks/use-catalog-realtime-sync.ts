import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Page } from '@/shared/api/contracts'
import { realtimeClient } from '@/shared/realtime/client'
import type { Nft, NftSummary } from '../model/contracts'

/**
 * Applies `nft.updated` to every cached shape that holds price/availability (detail, search
 * pages, featured). The realtime client already drops duplicates and stale versions; this hook
 * only has to merge the payload into whichever caches currently hold that NFT.
 * Call this once near the app root — it's idempotent to mount more than once, but there's no
 * reason to.
 */
export function useCatalogRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return realtimeClient.subscribe('nft.updated', (event) => {
      const { nftId, priceFrom, totalAvailable, editions } = event.payload

      queryClient.setQueryData<Nft>(['catalog', 'detail', nftId], (current) => {
        if (!current || current.version >= event.version) return current
        return {
          ...current,
          priceFrom,
          totalAvailable,
          version: event.version,
          editions: current.editions.map((edition) => {
            const update = editions.find((e) => e.id === edition.id)
            return update ? { ...edition, ...update } : edition
          }),
        }
      })

      const mergeSummary = (summary: NftSummary): NftSummary =>
        summary.id === nftId && summary.version < event.version
          ? { ...summary, priceFrom, totalAvailable, version: event.version }
          : summary

      queryClient.setQueriesData<Page<NftSummary>>({ queryKey: ['catalog', 'search'] }, (current) =>
        current ? { ...current, items: current.items.map(mergeSummary) } : current,
      )
      queryClient.setQueryData<NftSummary[]>(['catalog', 'featured'], (current) => current?.map(mergeSummary))
    })
  }, [queryClient])
}
