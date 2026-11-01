import { describe, expect, it } from 'vitest'

import { add, compare, div, formatEth, isZero, mul, sub } from './money'

describe('money', () => {
  describe('add', () => {
    it('soma valores sem erro de ponto flutuante', () => {
      expect(add('0.1', '0.2')).toBe('0.3')
    })

    it('soma valores inteiros', () => {
      expect(add('2', '3')).toBe('5')
    })

    it('soma valores com casas decimais', () => {
      expect(add('1.19', '0.81')).toBe('2')
    })
  })

  describe('sub', () => {
    it('subtrai valores sem erro de ponto flutuante', () => {
      expect(sub('0.3', '0.1')).toBe('0.2')
    })

    it('suporta resultado negativo', () => {
      expect(sub('1', '1.5')).toBe('-0.5')
    })
  })

  describe('mul', () => {
    it('multiplica por um fator inteiro', () => {
      expect(mul('1.19', '3')).toBe('3.57')
    })

    it('multiplica valores decimais', () => {
      expect(mul('0.1', '0.2')).toBe('0.02')
    })
  })

  describe('div', () => {
    it('divide valores', () => {
      expect(div('1', '2')).toBe('0.5')
    })

    it('divide por um divisor decimal', () => {
      expect(div('3', '0.5')).toBe('6')
    })
  })

  describe('compare', () => {
    it('retorna -1 quando a < b', () => {
      expect(compare('1.19', '1.20')).toBe(-1)
    })

    it('retorna 0 quando a === b', () => {
      expect(compare('1.190000', '1.19')).toBe(0)
    })

    it('retorna 1 quando a > b', () => {
      expect(compare('2', '1.99')).toBe(1)
    })
  })

  describe('isZero', () => {
    it('reconhece zero', () => {
      expect(isZero('0')).toBe(true)
      expect(isZero('0.000')).toBe(true)
    })

    it('reconhece valor não-zero', () => {
      expect(isZero('0.01')).toBe(false)
    })
  })

  describe('formatEth', () => {
    it('remove zeros à direita', () => {
      expect(formatEth('1.190000')).toBe('1.19')
    })

    it('preserva o valor sem casas decimais', () => {
      expect(formatEth('2')).toBe('2')
    })

    it('mantém até 6 casas decimais sem arredondar', () => {
      expect(formatEth('0.1234567')).toBe('0.123456')
    })

    it('formata valores negativos', () => {
      expect(formatEth('-0.500000')).toBe('-0.5')
    })
  })
})
