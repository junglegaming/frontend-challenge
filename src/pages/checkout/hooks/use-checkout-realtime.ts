import { useEffect, useEffectEvent } from 'react'
import type { Quote } from '@/domains/cart'
import { realtimeClient } from '@/shared/realtime/client'

/**
 * The global catalog sync never touches the checkout quote, so the page listens itself
 * (research.md R4): an `nft.updated` for an item being bought, or a reconnection, means the
 * quote on screen may be outdated. The realtime client already drops duplicates and stale versions.
 */
export function useCheckoutRealtime(quote: Quote | undefined, onQuoteOutdated: () => void) {
  const onNftUpdated = useEffectEvent((nftId: string) => {
    if (quote?.lines.some((line) => line.nftId === nftId)) onQuoteOutdated()
  })
  const onReconnect = useEffectEvent(() => onQuoteOutdated())

  useEffect(() => {
    const unsubscribeEvent = realtimeClient.subscribe('nft.updated', (event) => onNftUpdated(event.payload.nftId))
    const unsubscribeReconnect = realtimeClient.onReconnect(() => onReconnect())
    return () => {
      unsubscribeEvent()
      unsubscribeReconnect()
    }
  }, [])
}
