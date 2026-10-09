import type { Coupon } from '@/lib/http/schemas'

export const SEED_COUPONS: Coupon[] = [
  {
    code: 'LAUNCH10',
    type: 'percent',
    value: 10,
    description: 'Desconto do lançamento',
  },
  {
    code: 'GREEN5',
    type: 'percent',
    value: 5,
    description: 'Desconto verde',
  },
  {
    code: 'EXPIRED',
    type: 'percent',
    value: 15,
    description: 'Cupom de campanha encerrada',
    expiresAt: '2020-06-01T00:00:00.000Z',
  },
]

export const FAKE_COUPON_CODE = 'FAKE'
