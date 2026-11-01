import { describe, expect, it } from 'vitest'

import { toSafeRedirect } from './redirect'

describe('toSafeRedirect', () => {
  it('aceita caminhos internos com busca', () => {
    expect(toSafeRedirect('/pagamento')).toBe('/pagamento')
    expect(toSafeRedirect('/pedido/ord-1?x=1')).toBe('/pedido/ord-1?x=1')
  })

  it('rejeita URLs externas e protocol-relative', () => {
    expect(toSafeRedirect('https://evil.example')).toBeUndefined()
    expect(toSafeRedirect('//evil.example')).toBeUndefined()
    expect(toSafeRedirect('/\\evil.example')).toBeUndefined()
    expect(toSafeRedirect('javascript:alert(1)')).toBeUndefined()
  })

  it('rejeita valores que não são texto', () => {
    expect(toSafeRedirect(undefined)).toBeUndefined()
    expect(toSafeRedirect(42)).toBeUndefined()
  })
})
