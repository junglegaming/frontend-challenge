import { compareEth, formatEth } from '@/lib/eth'
import { EDITION_LABELS } from '@/schemas/nft'
import type { Quote } from '@/schemas/quote'

interface QuoteDiffProps {
  previous: Quote
  next: Quote
}

interface ItemDiff {
  key: string
  name: string
  editionLabel: string
  before?: { quantity: number; unitPrice: string }
  after?: { quantity: number; unitPrice: string }
}

function amount(value: string) {
  return formatEth(value)
}

function buildItemDiffs(previous: Quote, next: Quote): ItemDiff[] {
  const keyOf = (item: { nftId: string; editionId: string }) => `${item.nftId}:${item.editionId}`
  const before = new Map(previous.items.map((item) => [keyOf(item), item]))
  const after = new Map(next.items.map((item) => [keyOf(item), item]))
  const keys = new Set([...before.keys(), ...after.keys()])
  const rows: ItemDiff[] = []

  for (const key of keys) {
    const oldItem = before.get(key)
    const newItem = after.get(key)
    if (oldItem && newItem) {
      if (compareEth(oldItem.unitPrice, newItem.unitPrice) === 0 && oldItem.quantity === newItem.quantity) continue
      rows.push({
        key,
        name: newItem.name,
        editionLabel: EDITION_LABELS[newItem.editionId],
        before: { quantity: oldItem.quantity, unitPrice: oldItem.unitPrice },
        after: { quantity: newItem.quantity, unitPrice: newItem.unitPrice },
      })
      continue
    }
    if (newItem) {
      rows.push({
        key,
        name: newItem.name,
        editionLabel: EDITION_LABELS[newItem.editionId],
        after: { quantity: newItem.quantity, unitPrice: newItem.unitPrice },
      })
    } else if (oldItem) {
      rows.push({
        key,
        name: oldItem.name,
        editionLabel: EDITION_LABELS[oldItem.editionId],
        before: { quantity: oldItem.quantity, unitPrice: oldItem.unitPrice },
      })
    }
  }
  return rows
}

function summaryDiffs(previous: Quote, next: Quote) {
  const rows = [
    { label: 'Subtotal', before: previous.subtotal, after: next.subtotal },
    { label: 'Desconto do lançamento', before: previous.discount, after: next.discount },
    { label: 'Taxa de rede', before: previous.networkFee, after: next.networkFee },
    { label: 'Total', before: previous.total, after: next.total },
  ]
  return rows.filter((row) => compareEth(row.before, row.after) !== 0)
}

export function QuoteDiff({ previous, next }: QuoteDiffProps) {
  const items = buildItemDiffs(previous, next)
  const summaries = summaryDiffs(previous, next)

  return (
    <section role="alert" aria-labelledby="quote-diff-heading" className="rounded-sm border border-accent-text/60 bg-background/40 p-4">
      <h2 id="quote-diff-heading" className="font-bold text-accent-text">
        Os valores mudaram
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A cotação foi atualizada. Revise as diferenças e confirme a compra novamente.
      </p>

      {items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col gap-1 border-b border-border/60 pb-2 last:border-0 last:pb-0">
              <span className="font-bold">
                {item.name} <span className="font-normal text-muted-foreground">· Edição {item.editionLabel}</span>
              </span>
              {item.before && item.after ? (
                <span className="text-muted-foreground">
                  {item.before.quantity !== item.after.quantity && (
                    <>
                      Quantidade {item.before.quantity} → {item.after.quantity}.{' '}
                    </>
                  )}
                  {compareEth(item.before.unitPrice, item.after.unitPrice) !== 0 && (
                    <>
                      Preço {amount(item.before.unitPrice)} → {amount(item.after.unitPrice)}.
                    </>
                  )}
                </span>
              ) : item.after ? (
                <span className="text-muted-foreground">
                  Item adicionado: {item.after.quantity} × {amount(item.after.unitPrice)}.
                </span>
              ) : (
                <span className="text-muted-foreground">Item removido do carrinho.</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {summaries.length > 0 && (
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          {summaries.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt>{row.label}</dt>
              <dd className="text-right tabular-nums">
                <span className="text-muted-foreground">{amount(row.before)}</span>
                <span aria-hidden="true"> → </span>
                <span className="sr-only"> para </span>
                <span className="font-bold text-accent-text">{amount(row.after)}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
