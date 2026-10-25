import { describe, expect, it } from 'vitest'
import { addEth, compareEth, formatEth, fromWei, mulEth, percentOf, subEth, toWei } from './eth'

describe('eth', () => {
  it('converte para wei sem perder precisão', () => {
    expect(toWei('1')).toBe(10n ** 18n)
    expect(toWei('0.000000000000000001')).toBe(1n)
    expect(fromWei(toWei('26.846'))).toBe('26.846')
  })

  it('soma, subtrai e multiplica exato', () => {
    expect(addEth('0.1', '0.2')).toBe('0.30')
    expect(addEth('2.38', '8.34', '16.11')).toBe('26.83')
    expect(subEth('26.846', '0.016')).toBe('26.83')
    expect(mulEth('1.19', 2)).toBe('2.38')
  })

  it('calcula percentual arredondando para baixo em wei', () => {
    expect(percentOf('26.83', 10)).toBe('2.683')
  })

  it('compara e formata', () => {
    expect(compareEth('1.10', '1.1')).toBe(0)
    expect(compareEth('1.2', '1.19')).toBe(1)
    expect(formatEth('1.19')).toBe('1.19 ETH')
  })

  it('rejeita entradas inválidas', () => {
    expect(() => toWei('abc')).toThrow()
    expect(() => toWei('1.0000000000000000001')).toThrow()
    expect(() => toWei('-1')).toThrow()
  })
})
