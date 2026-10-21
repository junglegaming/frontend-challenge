import type { Quote } from '@/domains/cart'
import { eth } from '@/shared/lib/eth'
import type { QuoteChange } from '../model/quote-diff'

export const ISSUE_MESSAGE: Record<Quote['issues'][number]['type'], string> = {
  price_changed: 'O preço de um item mudou. Revise o carrinho antes de continuar.',
  quantity_exceeds_stock: 'A quantidade de um item excede o estoque disponível.',
  sold_out: 'Um dos itens está esgotado.',
  coupon_removed: 'O cupom aplicado não é mais válido e foi removido.',
}

export function OrderSummary({ quote, change }: { quote: Quote; change?: QuoteChange | null }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <h2 className="text-title font-bold">Seus NFTs</h2>

      <ul className="flex flex-col gap-3">
        {quote.lines.map((line) => {
          const priceChange = change?.lines.find((l) => l.itemId === line.itemId)
          return (
            <li key={line.itemId} className="flex items-center gap-3">
              <img src={line.image.src} alt={line.image.alt} width={40} height={40} className="size-10 rounded-sm object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold break-words text-foreground">{line.name}</p>
                <p className="text-caption text-muted-foreground">
                  {line.editionName} (x {line.quantity})
                </p>
                {priceChange && (
                  <p className="text-caption text-warning">
                    Preço alterado: <s>{eth.format(priceChange.previous)}</s> → {eth.format(priceChange.current)}
                  </p>
                )}
              </div>
              <p className="font-bold text-primary">{eth.format(line.lineTotal)}</p>
            </li>
          )
        })}
      </ul>

      {quote.issues.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-caption text-destructive">
          {quote.issues.map((issue, index) => (
            <li key={index}>{ISSUE_MESSAGE[issue.type]}</li>
          ))}
        </ul>
      )}

      <dl className="flex flex-col gap-2 text-body">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{eth.format(quote.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Desconto do lançamento</dt>
          <dd>{eth.isZero(quote.discount) ? '(-) 0.00' : `(-) ${eth.format(quote.discount)}`}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Taxa de rede</dt>
          <dd>{eth.format(quote.networkFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-2 text-title font-bold">
          <dt>Total</dt>
          <dd>
            {change?.total && (
              <s className="mr-2 font-normal text-muted-foreground">{eth.format(change.total.previous)}</s>
            )}
            {eth.format(quote.total)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
