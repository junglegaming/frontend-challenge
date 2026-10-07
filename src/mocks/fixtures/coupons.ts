import type { EthAmount } from '@/shared/lib/eth'

export type CouponRule =
  | { kind: 'percent'; percent: number }
  | { kind: 'fixed'; amount: EthAmount; minSubtotal: EthAmount }

export interface CouponDefinition {
  code: string
  description: string
  rule: CouponRule
  expiresAt: string
}

/** Documented in README: NFT10 (válido), WELCOME5 (válido com mínimo), VERAO25 (expirado). */
export const COUPONS: CouponDefinition[] = [
  { code: 'NFT10', description: '10% de desconto no subtotal', rule: { kind: 'percent', percent: 10 }, expiresAt: '2099-12-31T23:59:59.000Z' },
  {
    code: 'WELCOME5',
    description: '0,05 ETH de desconto em pedidos a partir de 0,2 ETH',
    rule: { kind: 'fixed', amount: '0.05', minSubtotal: '0.2' },
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  { code: 'VERAO25', description: '25% de desconto de verão', rule: { kind: 'percent', percent: 25 }, expiresAt: '2025-03-20T23:59:59.000Z' },
]
