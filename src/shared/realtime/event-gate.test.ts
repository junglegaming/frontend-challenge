import { describe, expect, it } from 'vitest'

import { createEventGate } from './event-gate'

describe('createEventGate', () => {
  it('aplica a primeira ocorrência de um evento', () => {
    expect(createEventGate().accept('nft:nft-1', 2, 'nft:nft-1:v2')).toBe(true)
  })

  it('descarta duplicatas pelo eventId', () => {
    const gate = createEventGate()
    gate.accept('nft:nft-1', 2, 'nft:nft-1:v2')
    expect(gate.accept('nft:nft-1', 2, 'nft:nft-1:v2')).toBe(false)
  })

  it('descarta versões antigas sem regredir o estado', () => {
    const gate = createEventGate()
    gate.accept('order:o-1', 3, 'order:o-1:v3')
    expect(gate.accept('order:o-1', 2, 'order:o-1:v2')).toBe(false)
    expect(gate.accept('order:o-1', 3, 'outro-id-mesma-versao')).toBe(false)
  })

  it('aceita versões mais novas e isola recursos diferentes', () => {
    const gate = createEventGate()
    gate.accept('nft:nft-1', 5, 'a')
    expect(gate.accept('nft:nft-1', 6, 'b')).toBe(true)
    expect(gate.accept('nft:nft-2', 1, 'c')).toBe(true)
  })
})
