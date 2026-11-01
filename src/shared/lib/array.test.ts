import { describe, expect, it } from 'vitest'

import { range, unique } from './array'

describe('array', () => {
  describe('range', () => {
    it('gera um array de 0 até n - 1', () => {
      expect(range(5)).toEqual([0, 1, 2, 3, 4])
    })

    it('retorna array vazio para n = 0', () => {
      expect(range(0)).toEqual([])
    })
  })

  describe('unique', () => {
    it('remove duplicados preservando a ordem', () => {
      expect(unique([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4])
    })

    it('mantém array sem duplicados intacto', () => {
      expect(unique(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('funciona com array vazio', () => {
      expect(unique([])).toEqual([])
    })

    it('remove duplicados em array de objetos por referência', () => {
      const obj = { id: 1 }
      expect(unique([obj, obj])).toEqual([obj])
    })
  })
})
