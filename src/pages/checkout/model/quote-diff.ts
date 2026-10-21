import type { Quote, QuoteIssue } from '@/domains/cart'
import { eth, type EthAmount } from '@/shared/lib/eth'

export interface AmountChange {
  previous: EthAmount
  current: EthAmount
}

/** What changed between the quote the collector reviewed and the current one (research.md R3). */
export interface QuoteChange {
  lines: ({ itemId: string; name: string } & AmountChange)[]
  removed: { itemId: string; name: string }[]
  issues: QuoteIssue[]
  networkFee: AmountChange | null
  total: AmountChange | null
  /** The current quote cannot be purchased (sold out / above stock): confirming stays blocked. */
  blocking: boolean
}

const changed = (previous: EthAmount, current: EthAmount): AmountChange | null =>
  eth.equals(previous, current) ? null : { previous, current }

/** Compares two server quotes; totals are never recomputed here, only compared. */
export function diffQuotes(previous: Quote, current: Quote): QuoteChange | null {
  if (previous.signature === current.signature && current.issues.length === 0 && current.purchasable) return null

  const lines = current.lines.flatMap((line) => {
    const before = previous.lines.find((l) => l.itemId === line.itemId)
    const diff = before && changed(before.unitPrice, line.unitPrice)
    return diff ? [{ itemId: line.itemId, name: line.name, ...diff }] : []
  })
  const removed = previous.lines
    .filter((line) => !current.lines.some((l) => l.itemId === line.itemId))
    .map(({ itemId, name }) => ({ itemId, name }))

  return {
    lines,
    removed,
    issues: current.issues,
    networkFee: changed(previous.networkFee, current.networkFee),
    total: changed(previous.total, current.total),
    blocking: !current.purchasable,
  }
}
