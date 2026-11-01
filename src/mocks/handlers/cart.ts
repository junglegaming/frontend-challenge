import { HttpResponse, http } from 'msw'

import type {
  AddCartItemRequest,
  Cart,
  CartItem,
  Quote,
  QuoteRequest,
  UpdateCartItemRequest,
} from '@/shared/contracts'

import { getDb, persist } from '../db'
import { QuoteError, computeTotals } from '../pricing'
import { simulateNetwork } from '../scenarios'
import { errorResponse, getOwnerKey } from '../utils'

function getCart(ownerKey: string): Cart {
  return getDb().carts[ownerKey] ?? { items: [], version: 0 }
}

function resolveEdition(nftId: string, editionId: string) {
  const nft = getDb().nfts.find((n) => n.id === nftId)
  if (!nft) return null
  const edition = nft.editions.find((e) => e.id === editionId)
  if (!edition) return null
  return { nft, edition }
}

/**
 * O carrinho guarda a escolha do usuário; preço, nome, imagem e estoque vêm
 * sempre do catálogo atual — mudanças de preço/estoque aparecem ao reabrir.
 */
function withCurrentCatalog(cart: Cart): Cart {
  const items: CartItem[] = cart.items.map((item) => {
    const resolved = resolveEdition(item.nftId, item.editionId)
    if (!resolved) return item
    return {
      ...item,
      name: resolved.nft.name,
      editionName: resolved.edition.name,
      imageUrl: resolved.nft.imageUrl,
      priceEth: resolved.nft.priceEth,
      // Carrinhos salvos antes deste campo guardavam o preço da adição em `priceEth`.
      addedPriceEth: item.addedPriceEth || item.priceEth,
      available: resolved.edition.available,
    }
  })
  return { ...cart, items }
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    return HttpResponse.json(withCurrentCatalog(getCart(getOwnerKey(request))))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const body = (await request.json()) as AddCartItemRequest
    const resolved = resolveEdition(body.nftId, body.editionId)
    if (!resolved) return errorResponse('NOT_FOUND', 'NFT ou edição não encontrados', 404)

    const db = getDb()
    const ownerKey = getOwnerKey(request)
    const cart = getCart(ownerKey)
    const existing = cart.items.find(
      (i) => i.nftId === body.nftId && i.editionId === body.editionId,
    )
    const newQuantity = (existing?.quantity ?? 0) + body.quantity

    if (resolved.edition.available < newQuantity) {
      return errorResponse('AVAILABILITY_CONFLICT', 'Estoque insuficiente para esta edição', 409)
    }

    if (existing) {
      existing.quantity = newQuantity
      existing.name = resolved.nft.name
      existing.editionName = resolved.edition.name
      existing.imageUrl = resolved.nft.imageUrl
      existing.priceEth = resolved.nft.priceEth
      // Adicionar de novo é aceitar o preço atual.
      existing.addedPriceEth = resolved.nft.priceEth
      existing.available = resolved.edition.available
    } else {
      const item: CartItem = {
        id: `ci-${crypto.randomUUID()}`,
        nftId: resolved.nft.id,
        editionId: resolved.edition.id,
        editionName: resolved.edition.name,
        name: resolved.nft.name,
        imageUrl: resolved.nft.imageUrl,
        quantity: body.quantity,
        priceEth: resolved.nft.priceEth,
        addedPriceEth: resolved.nft.priceEth,
        available: resolved.edition.available,
      }
      cart.items.push(item)
    }

    cart.version += 1
    db.carts[ownerKey] = cart
    persist()
    return HttpResponse.json(cart)
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const body = (await request.json()) as UpdateCartItemRequest
    const db = getDb()
    const ownerKey = getOwnerKey(request)
    const cart = getCart(ownerKey)
    const item = cart.items.find((i) => i.id === params.itemId)
    if (!item) return errorResponse('NOT_FOUND', 'Item não encontrado no carrinho', 404)

    const resolved = resolveEdition(item.nftId, item.editionId)
    if (!resolved) return errorResponse('NOT_FOUND', 'NFT ou edição não encontrados', 404)

    if (resolved.edition.available < body.quantity) {
      return errorResponse('AVAILABILITY_CONFLICT', 'Estoque insuficiente para esta edição', 409)
    }

    item.quantity = body.quantity
    item.available = resolved.edition.available
    cart.version += 1
    db.carts[ownerKey] = cart
    persist()
    return HttpResponse.json(cart)
  }),

  http.delete('/api/cart/items/:itemId', ({ request, params }) => {
    const db = getDb()
    const ownerKey = getOwnerKey(request)
    const cart = getCart(ownerKey)
    cart.items = cart.items.filter((i) => i.id !== params.itemId)
    cart.version += 1
    db.carts[ownerKey] = cart
    persist()
    return HttpResponse.json(cart)
  }),

  http.post('/api/quote', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const body = (await request.json()) as QuoteRequest
    const db = getDb()

    const pricedItems: Array<{ priceEth: string; quantity: number }> = []
    for (const item of body.items) {
      const nft = db.nfts.find((n) => n.id === item.nftId)
      if (!nft) return errorResponse('NOT_FOUND', 'NFT não encontrado', 404)
      const edition = nft.editions.find((e) => e.id === item.editionId)
      if (!edition) return errorResponse('NOT_FOUND', 'Edição não encontrada', 404)
      if (edition.available < item.quantity) {
        return errorResponse('AVAILABILITY_CONFLICT', `Estoque insuficiente para ${nft.name}`, 409)
      }
      pricedItems.push({ priceEth: nft.priceEth, quantity: item.quantity })
    }

    // Mesmo cálculo da criação do pedido: a cotação é a referência para confirmar.
    let totals
    try {
      totals = computeTotals(pricedItems, body.couponCode)
    } catch (e) {
      if (e instanceof QuoteError) return errorResponse(e.code, e.message, e.status)
      throw e
    }

    const quote: Quote = { ...totals, version: getCart(getOwnerKey(request)).version }
    return HttpResponse.json(quote)
  }),
]
