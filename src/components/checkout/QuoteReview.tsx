import { useEffect, useRef } from 'react'
import { EthPrice } from '@/components/common/EthPrice'
import { nftImageProps } from '@/lib/images'
import { NETWORK_LABELS } from '@/schemas/common'
import { EDITION_LABELS } from '@/schemas/nft'
import type { Quote } from '@/schemas/quote'
import { SummaryLines } from '@/components/cart/SummaryLines'

interface QuoteReviewProps {
  quote: Quote
}

export function QuoteReview({ quote }: QuoteReviewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="quote-review-heading" className="flex flex-col gap-5">
      <div>
        <h2 id="quote-review-heading" ref={headingRef} tabIndex={-1} className="font-bold outline-none">
          Revise seu pedido
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cotação congelada para {NETWORK_LABELS[quote.network]}. Confira os itens e os valores antes de confirmar.
        </p>
      </div>

      <div>
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_120px] gap-4 border-b border-border pb-2 text-sm text-muted-foreground sm:grid">
          <span>NFTs</span>
          <span>Edições</span>
          <span>Subtotal</span>
        </div>
        <ul className="divide-y divide-border">
          {quote.items.map((item) => (
            <li key={`${item.nftId}-${item.editionId}`} className="flex items-center gap-3 py-3">
              <img
                {...nftImageProps(item.image, '64px')}
                alt={`Arte do NFT ${item.name}`}
                loading="lazy"
                decoding="async"
                className="size-14 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{item.name}</p>
                <p className="text-xs text-subtle">ID do token: {item.tokenId}</p>
                <p className="text-xs text-muted-foreground">Edição: {EDITION_LABELS[item.editionId]}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <span className="text-xs text-muted-foreground">(x {item.quantity})</span>
                <EthPrice value={item.lineTotal} className="text-sm text-accent-text" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <SummaryLines summary={quote} />
    </section>
  )
}
