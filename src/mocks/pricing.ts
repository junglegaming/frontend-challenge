import { add, compare, div, mul, sub } from '@/shared/lib/money'

export type CouponDef = {
  code: string
  type: 'percent' | 'fixed'
  value: string
  expired?: boolean
}

export const COUPONS: CouponDef[] = [
  { code: 'KURIO10', type: 'percent', value: '10' },
  { code: 'LANCAMENTO5', type: 'percent', value: '5' },
  { code: 'EXPIRADO20', type: 'percent', value: '20', expired: true },
]

/** Taxa de rede aplicada sobre o subtotal (mock). */
export const NETWORK_FEE_RATE = '0.025'

export type QuoteTotals = {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export class QuoteError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'QuoteError'
    this.code = code
    this.status = status
  }
}

/**
 * Calcula os totais de uma cotação (referência para finalizar o pedido).
 * Tudo em ETH como string decimal, via big.js.
 */
export function computeTotals(
  items: Array<{ priceEth: string; quantity: number }>,
  couponCode?: string,
): QuoteTotals {
  let subtotalEth = '0'
  for (const item of items) {
    subtotalEth = add(subtotalEth, mul(item.priceEth, String(item.quantity)))
  }

  let discountEth = '0'
  if (couponCode) {
    const coupon = COUPONS.find((c) => c.code === couponCode)
    if (!coupon) throw new QuoteError('COUPON_INVALID', 'Cupom inválido', 422)
    if (coupon.expired) throw new QuoteError('COUPON_EXPIRED', 'Cupom expirado', 422)
    if (coupon.type === 'percent') {
      discountEth = mul(subtotalEth, div(coupon.value, '100'))
    } else {
      // Desconto fixo nunca passa do subtotal.
      discountEth = compare(coupon.value, subtotalEth) > 0 ? subtotalEth : coupon.value
    }
  }

  const networkFeeEth = mul(subtotalEth, NETWORK_FEE_RATE)
  const totalEth = sub(add(subtotalEth, networkFeeEth), discountEth)

  return { subtotalEth, discountEth, networkFeeEth, totalEth }
}
