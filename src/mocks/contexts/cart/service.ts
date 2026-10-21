import Decimal from 'decimal.js'
import type { AddCartItemRequest, Cart, CartItem, CartItemStatus, Quote } from '@/domains/cart'
import type { Network } from '@/domains/wallets'
import type { Clock } from '../../infra/store'
import { DomainError, errors } from '../../http/errors'
import type { CartLineRecord, CartRecord } from '../../state'
import type { CatalogRepository } from '../catalog/repository'
import { computeQuote, evaluateCoupon } from './quote'
import type { CartRepository } from './repository'

export const userCartId = (userId: string) => `user:${userId}`
export const guestCartIdOf = (guestId: string) => `guest:${guestId}`
const itemId = (line: Pick<CartLineRecord, 'nftId' | 'editionId'>) => `${line.nftId}:${line.editionId}`

export class CartService {
  private readonly carts: CartRepository
  private readonly catalog: CatalogRepository
  private readonly clock: Clock

  constructor(carts: CartRepository, catalog: CatalogRepository, clock: Clock) {
    this.carts = carts
    this.catalog = catalog
    this.clock = clock
  }

  view(cartId: string): Cart {
    const cart = this.carts.find(cartId)
    const items = this.toItems(cart)
    return {
      id: cartId,
      items,
      couponCode: cart.couponCode,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      updatedAt: cart.updatedAt,
    }
  }

  addItem(cartId: string, request: AddCartItemRequest): Cart {
    this.assertQuantity(request.quantity)
    const found = this.catalog.findEdition(request.nftId, request.editionId)
    if (!found) throw errors.notFound('Edição')
    const { edition } = found
    if (edition.status !== 'available') {
      throw errors.availability('Esta edição não está disponível para compra.', { available: 0 })
    }
    const cart = this.carts.find(cartId)
    const existing = cart.lines.find((l) => l.nftId === request.nftId && l.editionId === request.editionId)
    const nextQuantity = (existing?.quantity ?? 0) + request.quantity
    this.assertWithinLimits(nextQuantity, edition.available, edition.maxPerOrder, existing?.quantity ?? 0)

    if (existing) {
      existing.quantity = nextQuantity
      existing.acknowledgedUnitPrice = edition.price
    } else {
      cart.lines.push({ ...request, quantity: nextQuantity, acknowledgedUnitPrice: edition.price })
    }
    this.carts.save(cart)
    return this.view(cartId)
  }

  updateItem(cartId: string, id: string, change: { quantity?: number; acknowledgePrice?: boolean }): Cart {
    const cart = this.carts.find(cartId)
    const line = cart.lines.find((l) => itemId(l) === id)
    if (!line) throw errors.notFound('Item do carrinho')
    const found = this.catalog.findEdition(line.nftId, line.editionId)
    if (!found) throw errors.notFound('Edição')

    if (change.quantity !== undefined) {
      this.assertQuantity(change.quantity)
      this.assertWithinLimits(change.quantity, found.edition.available, found.edition.maxPerOrder, 0)
      line.quantity = change.quantity
    }
    if (change.acknowledgePrice) line.acknowledgedUnitPrice = found.edition.price
    this.carts.save(cart)
    return this.view(cartId)
  }

  removeItem(cartId: string, id: string): Cart {
    const cart = this.carts.find(cartId)
    cart.lines = cart.lines.filter((l) => itemId(l) !== id)
    this.carts.save(cart)
    return this.view(cartId)
  }

  applyCoupon(cartId: string, code: string): Cart {
    if (!code.trim()) throw errors.validation({ code: 'Informe um cupom.' })
    const cart = this.carts.find(cartId)
    const subtotal = this.toItems(cart).reduce((sum, i) => sum.plus(new Decimal(i.unitPrice).times(i.quantity)), new Decimal(0))
    const evaluation = evaluateCoupon(code, subtotal, this.clock.now())
    if (evaluation.status === 'invalid') {
      throw new DomainError(422, 'COUPON_INVALID', 'Cupom inválido.', { code: 'Cupom inválido.' })
    }
    if (evaluation.status === 'expired') {
      throw new DomainError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: 'Este cupom expirou.' })
    }
    if (evaluation.status === 'below_minimum') {
      throw new DomainError(422, 'COUPON_INVALID', 'O subtotal não atinge o mínimo do cupom.', {
        code: 'O subtotal não atinge o mínimo do cupom.',
      })
    }
    cart.couponCode = evaluation.coupon.code
    this.carts.save(cart)
    return this.view(cartId)
  }

  removeCoupon(cartId: string): Cart {
    const cart = this.carts.find(cartId)
    cart.couponCode = null
    this.carts.save(cart)
    return this.view(cartId)
  }

  quote(cartId: string, network: Network): Quote {
    const cart = this.carts.find(cartId)
    return computeQuote(this.toItems(cart), cart.couponCode, network, this.clock.now())
  }

  /** Moves the visitor's items into the user's cart, clamping to stock and per-order limits. */
  merge(guestId: string, userId: string): Cart {
    const guest = this.carts.find(guestCartIdOf(guestId))
    const target = this.carts.find(userCartId(userId))
    for (const line of guest.lines) {
      const found = this.catalog.findEdition(line.nftId, line.editionId)
      if (!found) continue
      const limit = Math.min(found.edition.available, found.edition.maxPerOrder)
      const existing = target.lines.find((l) => itemId(l) === itemId(line))
      const merged = Math.min(limit, (existing?.quantity ?? 0) + line.quantity)
      if (merged <= 0) continue
      if (existing) existing.quantity = merged
      else target.lines.push({ ...line, quantity: merged })
    }
    target.couponCode ??= guest.couponCode
    this.carts.save(target)
    this.carts.delete(guestCartIdOf(guestId))
    return this.view(userCartId(userId))
  }

  /** After a confirmed order, removes exactly the purchased quantities. */
  subtractPurchased(userId: string, purchased: Array<{ nftId: string; editionId: string; quantity: number }>) {
    const cart = this.carts.find(userCartId(userId))
    cart.lines = cart.lines
      .map((line) => {
        const bought = purchased.find((p) => itemId(p) === itemId(line))
        return bought ? { ...line, quantity: line.quantity - bought.quantity } : line
      })
      .filter((line) => line.quantity > 0)
    this.carts.save(cart)
  }

  private toItems(cart: CartRecord): CartItem[] {
    return cart.lines.flatMap((line) => {
      const found = this.catalog.findEdition(line.nftId, line.editionId)
      if (!found) return []
      const { nft, edition } = found
      let status: CartItemStatus = 'ok'
      if (edition.status !== 'available') status = 'sold_out'
      else if (line.quantity > edition.available) status = 'quantity_exceeds_stock'
      else if (!new Decimal(edition.price).equals(line.acknowledgedUnitPrice)) status = 'price_changed'
      return [
        {
          id: itemId(line),
          nftId: nft.id,
          editionId: edition.id,
          name: nft.name,
          editionName: edition.name,
          artistName: nft.artist.name,
          image: { src: nft.image.src, alt: nft.image.alt },
          quantity: line.quantity,
          unitPrice: edition.price,
          acknowledgedUnitPrice: line.acknowledgedUnitPrice,
          available: edition.available,
          maxPerOrder: edition.maxPerOrder,
          status,
          nftVersion: nft.version,
        },
      ]
    })
  }

  private assertQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw errors.validation({ quantity: 'A quantidade deve ser um número inteiro maior que zero.' })
    }
  }

  private assertWithinLimits(quantity: number, available: number, maxPerOrder: number, inCart: number) {
    const limit = Math.min(available, maxPerOrder)
    if (quantity > limit) {
      throw errors.availability(
        available < maxPerOrder
          ? `Apenas ${available} unidade(s) disponível(is) desta edição.`
          : `Limite de ${maxPerOrder} unidade(s) por pedido para esta edição.`,
        { available, maxPerOrder, inCart },
      )
    }
  }
}
