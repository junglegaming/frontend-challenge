import { describe, expect, it } from 'vitest'

import { QuoteError, computeTotals } from './pricing'

describe('computeTotals', () => {
  it('calcula subtotal, taxa e total sem cupom', () => {
    const r = computeTotals([{ priceEth: '1.19', quantity: 3 }])
    expect(r.subtotalEth).toBe('3.57')
    expect(r.discountEth).toBe('0')
    expect(r.networkFeeEth).toBe('0.08925')
    expect(r.totalEth).toBe('3.65925')
  })

  it('aplica cupom percentual', () => {
    const r = computeTotals([{ priceEth: '1.00', quantity: 1 }], 'KURIO10')
    expect(r.discountEth).toBe('0.1')
    expect(r.totalEth).toBe('0.925')
  })

  it('rejeita cupom inválido', () => {
    expect(() => computeTotals([{ priceEth: '1', quantity: 1 }], 'XYZ')).toThrow(QuoteError)
  })

  it('rejeita cupom expirado', () => {
    expect(() => computeTotals([{ priceEth: '1', quantity: 1 }], 'EXPIRADO20')).toThrow(QuoteError)
  })

  it('preserva precisão decimal (0.1 + 0.2 = 0.3)', () => {
    const r = computeTotals([
      { priceEth: '0.1', quantity: 1 },
      { priceEth: '0.2', quantity: 1 },
    ])
    expect(r.subtotalEth).toBe('0.3')
  })
})
