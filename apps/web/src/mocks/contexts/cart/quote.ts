import Decimal from 'decimal.js'
import type { CartItem, Quote, QuoteIssue } from '@/domains/cart'
import type { Network } from '@/domains/wallets'
import { COUPONS, type CouponDefinition } from '../../fixtures/coupons'
import { fingerprint } from '../../infra/random'

const NETWORK_FEES: Record<Network, { base: string; perUnit: string }> = {
  ethereum: { base: '0.003', perUnit: '0.0006' },
  polygon: { base: '0.0001', perUnit: '0.00002' },
  arbitrum: { base: '0.0004', perUnit: '0.0001' },
  base: { base: '0.0003', perUnit: '0.00008' },
}

const QUOTE_TTL_MS = 10 * 60_000
const fixed = (value: Decimal) => value.toFixed(18)

export type CouponEvaluation =
  | { status: 'valid'; coupon: CouponDefinition; discount: Decimal }
  | { status: 'invalid'; coupon: null }
  | { status: 'expired'; coupon: CouponDefinition }
  | { status: 'below_minimum'; coupon: CouponDefinition }

/** Pure coupon rule: validity, expiration and discount (never above the subtotal). */
export function evaluateCoupon(code: string, subtotal: Decimal, now: number): CouponEvaluation {
  const coupon = COUPONS.find((c) => c.code === code.trim().toUpperCase()) ?? null
  if (!coupon) return { status: 'invalid', coupon: null }
  if (Date.parse(coupon.expiresAt) <= now) return { status: 'expired', coupon }
  if (coupon.rule.kind === 'fixed') {
    if (subtotal.lessThan(coupon.rule.minSubtotal)) return { status: 'below_minimum', coupon }
    return { status: 'valid', coupon, discount: Decimal.min(subtotal, coupon.rule.amount) }
  }
  return {
    status: 'valid',
    coupon,
    discount: subtotal.times(coupon.rule.percent).dividedBy(100).toDecimalPlaces(18, Decimal.ROUND_DOWN),
  }
}

/** Pure quote calculation. The API is the single source of truth for totals. */
export function computeQuote(items: CartItem[], couponCode: string | null, network: Network, now: number): Quote {
  const issues: QuoteIssue[] = []
  const lines = items.map((item) => {
    if (item.status === 'price_changed') {
      issues.push({ type: 'price_changed', itemId: item.id, previous: item.acknowledgedUnitPrice, current: item.unitPrice })
    }
    if (item.status === 'sold_out') issues.push({ type: 'sold_out', itemId: item.id })
    if (item.status === 'quantity_exceeds_stock') {
      issues.push({ type: 'quantity_exceeds_stock', itemId: item.id, requested: item.quantity, available: item.available })
    }
    return {
      itemId: item.id,
      nftId: item.nftId,
      editionId: item.editionId,
      name: item.name,
      editionName: item.editionName,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: fixed(new Decimal(item.unitPrice).times(item.quantity)),
    }
  })

  const subtotal = lines.reduce((sum, line) => sum.plus(line.lineTotal), new Decimal(0))
  let discount = new Decimal(0)
  let coupon: Quote['coupon'] = null
  if (couponCode) {
    const evaluation = evaluateCoupon(couponCode, subtotal, now)
    if (evaluation.status === 'valid') {
      discount = evaluation.discount
      coupon = { code: evaluation.coupon.code, description: evaluation.coupon.description }
    } else {
      issues.push({ type: 'coupon_removed', code: couponCode, reason: evaluation.status === 'expired' ? 'expired' : 'invalid' })
    }
  }

  const units = lines.reduce((sum, line) => sum + line.quantity, 0)
  const fee = NETWORK_FEES[network]
  const networkFee = units === 0 ? new Decimal(0) : new Decimal(fee.base).plus(new Decimal(fee.perUnit).times(units))
  const total = subtotal.minus(discount).plus(networkFee)
  const blocking = issues.some((i) => i.type === 'sold_out' || i.type === 'quantity_exceeds_stock')

  const values = {
    network,
    lines: lines.map((l) => [l.itemId, l.quantity, l.unitPrice]),
    coupon: coupon?.code ?? null,
    subtotal: fixed(subtotal),
    discount: fixed(discount),
    networkFee: fixed(networkFee),
    total: fixed(total),
  }

  return {
    signature: `q_${fingerprint(values)}`,
    network,
    lines,
    coupon,
    subtotal: values.subtotal,
    discount: values.discount,
    networkFee: values.networkFee,
    total: values.total,
    issues,
    purchasable: lines.length > 0 && !blocking,
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
}
