import { describe, expect, it } from 'vitest'
import type { DbOrder, DbState } from './db'
import { buildQuote, cartView, ensureCart, isQuoteStale, mergeCarts, resolveOrder, setCartQuantity, validateCoupon } from './domain'
import { buildSeed } from './fixtures'

function state(): DbState {
  return { ...buildSeed(), sessions: [], carts: [], favorites: {}, quotes: [], orders: [] }
}

describe('domínio do mock', () => {
  it('resume o carrinho com cupom e taxa', () => {
    const s = state()
    const cart = ensureCart(s, 'user:u_alice')
    setCartQuantity(s, cart, 'emerald-ape-042', '1/50', 2)
    cart.coupon = 'KURIO10'
    const view = cartView(s, cart)
    expect(view.summary).toEqual({ subtotal: '2.38', discount: '0.238', networkFee: '0.016', total: '2.158' })
  })

  it('rejeita cupom inválido e expirado', () => {
    expect(() => validateCoupon('NADA')).toThrow('Cupom inválido')
    expect(() => validateCoupon('EXPIRADO')).toThrow('Cupom expirado')
  })

  it('bloqueia quantidade acima da disponibilidade', () => {
    const s = state()
    const cart = ensureCart(s, 'user:u_alice')
    expect(() => setCartQuantity(s, cart, 'emerald-ape-042', '1/1', 2)).toThrow(/disponível/)
  })

  it('marca a cotação como desatualizada quando o preço muda', () => {
    const s = state()
    const cart = ensureCart(s, 'user:u_alice')
    setCartQuantity(s, cart, 'emerald-ape-042', '1/50', 1)
    const quote = buildQuote(s, cart, 'ethereum', 'w_alice_primary')
    expect(isQuoteStale(s, cart, quote)).toEqual({ stale: false })
    s.nfts[0].editions[2].price = '1.29'
    const result = isQuoteStale(s, cart, quote)
    expect(result.stale && result.fresh?.total).toBe('1.306')
  })

  it('confirma o pedido removendo só o que foi comprado', () => {
    const s = state()
    const cart = ensureCart(s, 'user:u_alice')
    setCartQuantity(s, cart, 'emerald-ape-042', '1/50', 3)
    const quote = buildQuote(s, cart, 'ethereum', 'w_alice_primary')
    quote.items[0].quantity = 2
    const before = s.nfts[0].editions[2].available
    const record = {
      userId: 'u_alice',
      outcome: 'confirm',
      order: { id: 'o1', status: 'pending', version: 1, confirmedAt: null, rejectionReason: null, receipt: { ...quote, couponCode: null, walletLabel: 'MetaMask', txHash: '0x1', explorerUrl: '', createdAt: '' } },
    } as unknown as DbOrder
    const result = resolveOrder(s, record)
    expect(result?.order.status).toBe('confirmed')
    expect(s.nfts[0].editions[2].available).toBe(before - 2)
    expect(cart.items[0].quantity).toBe(1)
    expect(resolveOrder(s, record)).toBeNull()
  })

  it('mescla o carrinho do visitante respeitando o estoque', () => {
    const s = state()
    const guest = ensureCart(s, 'guest:g1')
    const user = ensureCart(s, 'user:u_alice')
    setCartQuantity(s, guest, 'emerald-ape-042', '1/1', 1)
    setCartQuantity(s, user, 'emerald-ape-042', '1/1', 1)
    mergeCarts(s, guest, user)
    expect(user.items[0].quantity).toBe(1)
    expect(s.carts).toHaveLength(1)
  })
})
