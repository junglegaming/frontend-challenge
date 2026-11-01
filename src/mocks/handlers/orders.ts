import { http } from 'msw/core/http'

import { type CreateOrderRequest, type Order, createOrderRequestSchema } from '@/shared/contracts'
import { compare } from '@/shared/lib/money'

import { getDb, persist } from '../db'
import { json, sleep } from '../http'
import { QuoteError, computeTotals } from '../pricing'
import { emitNftUpdated, emitOrderUpdated } from '../realtime'
import { ORDER_TIMEOUT_DELAY_MS, isOrderTimeout, isPaymentDeclined } from '../scenarios'
import { errorResponse, getAuthenticatedUser, getOwnerKey } from '../utils'
import { findWalletConnection } from '../wallet-connections'

/** Tempo de processamento simulado do pagamento. */
const PAYMENT_PROCESSING_MS = 2000

/**
 * Impressão digital do conteúdo do pedido: mesma chave de idempotência com
 * outra impressão é reuso indevido. O total esperado fica de fora — um retry
 * do mesmo pedido após mudança de preço é a mesma intenção de compra.
 */
function fingerprintOf(body: CreateOrderRequest): string {
  const items = [...body.items].sort((a, b) =>
    `${a.nftId}:${a.editionId}`.localeCompare(`${b.nftId}:${b.editionId}`),
  )
  return JSON.stringify({
    items,
    couponCode: body.couponCode ?? null,
    walletId: body.walletId,
    network: body.network,
  })
}

/**
 * Confirmação: baixa o estoque (publicando `nft.updated`) e remove do
 * carrinho de origem só os itens e quantidades comprados.
 */
function settleConfirmedOrder(order: Order): void {
  const db = getDb()
  for (const item of order.items) {
    const nft = db.nfts.find((n) => n.id === item.nftId)
    const edition = nft?.editions.find((e) => e.id === item.editionId)
    if (!nft || !edition) continue
    edition.available = Math.max(0, edition.available - item.quantity)
    nft.version += 1
    emitNftUpdated({ nftId: nft.id, version: nft.version, priceEth: nft.priceEth })
  }

  const owner = db.orderOwners[order.id]
  const cart = owner ? db.carts[owner.ownerKey] : undefined
  if (!cart) return
  for (const purchased of order.items) {
    const cartItem = cart.items.find(
      (i) => i.nftId === purchased.nftId && i.editionId === purchased.editionId,
    )
    if (cartItem) cartItem.quantity -= purchased.quantity
  }
  cart.items = cart.items.filter((i) => i.quantity > 0)
  cart.version += 1
}

/** Resolve o pagamento: confirmado ou recusado (terminais), com `order.updated`. */
function settlePayment(orderId: string): void {
  const db = getDb()
  const order = db.orders[orderId]
  if (!order || order.status !== 'pending') return
  if (db.orderOwners[orderId]?.paymentOutcome === 'declined') {
    order.status = 'declined'
  } else {
    order.status = 'confirmed'
    order.transactionRef = `0x${crypto.randomUUID().replace(/-/g, '')}`
    settleConfirmedOrder(order)
  }
  order.version += 1
  persist()
  emitOrderUpdated({ orderId: order.id, status: order.status, version: order.version })
}

const scheduledResolutions = new Set<string>()

/**
 * Garante que o pagamento pendente se resolva no horário previsto — inclusive
 * depois de recarregar a página, quando o timer anterior deixou de existir.
 */
function ensurePaymentResolution(orderId: string): void {
  const db = getDb()
  const resolvesAt = db.orderOwners[orderId]?.paymentResolvesAt
  if (db.orders[orderId]?.status !== 'pending' || resolvesAt === undefined) return
  const wait = resolvesAt - Date.now()
  if (wait <= 0) {
    settlePayment(orderId)
    return
  }
  if (scheduledResolutions.has(orderId)) return
  scheduledResolutions.add(orderId)
  setTimeout(() => {
    scheduledResolutions.delete(orderId)
    settlePayment(orderId)
  }, wait)
}

export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return errorResponse('UNAUTHORIZED', 'Autenticação necessária', 401)

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) {
      return errorResponse('VALIDATION_ERROR', 'Cabeçalho Idempotency-Key é obrigatório', 422)
    }

    const parsed = createOrderRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse('VALIDATION_ERROR', 'Dados do pedido inválidos', 422)
    }
    const body = parsed.data
    const fingerprint = fingerprintOf(body)
    const db = getDb()

    // Idempotência: a mesma tentativa recupera o mesmo pedido (timeout/reenvio).
    const existingOrderId = db.idempotency[idempotencyKey]
    const existingOrder = existingOrderId ? db.orders[existingOrderId] : undefined
    if (existingOrderId && existingOrder) {
      const sameOwner = db.orderOwners[existingOrderId]?.userId === user.id
      if (!sameOwner || db.idempotencyFingerprints[idempotencyKey] !== fingerprint) {
        return errorResponse(
          'IDEMPOTENCY_CONFLICT',
          'Esta tentativa de compra já foi usada com outros dados',
          409,
        )
      }
      return json(existingOrder)
    }

    const wallet = (db.wallets[user.id] ?? []).find((w) => w.id === body.walletId)
    if (!wallet) {
      return errorResponse('VALIDATION_ERROR', 'Carteira não encontrada', 422, {
        walletId: 'Selecione uma carteira cadastrada',
      })
    }
    const connection = findWalletConnection(user.id, body.connectionId, body.walletId)
    if (!connection) {
      return errorResponse(
        'WALLET_DISCONNECTED',
        'A carteira foi desconectada. Conecte novamente para confirmar.',
        409,
      )
    }

    const items: Order['items'] = []
    for (const it of body.items) {
      const nft = db.nfts.find((n) => n.id === it.nftId)
      if (!nft) return errorResponse('NOT_FOUND', 'NFT não encontrado', 404)
      const edition = nft.editions.find((e) => e.id === it.editionId)
      if (!edition) return errorResponse('NOT_FOUND', 'Edição não encontrada', 404)
      if (edition.available < it.quantity) {
        return errorResponse('AVAILABILITY_CONFLICT', `Estoque insuficiente para ${nft.name}`, 409)
      }
      items.push({
        nftId: nft.id,
        editionId: edition.id,
        name: nft.name,
        quantity: it.quantity,
        priceEth: nft.priceEth,
        imageUrl: nft.imageUrl,
      })
    }
    if (items.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'O pedido não tem itens', 422)
    }

    let totals
    try {
      totals = computeTotals(items, body.couponCode)
    } catch (e) {
      if (e instanceof QuoteError) return errorResponse(e.code, e.message, e.status)
      throw e
    }

    if (compare(totals.totalEth, body.expectedTotalEth) !== 0) {
      return errorResponse(
        'STALE_QUOTE',
        'Os valores mudaram desde a sua revisão. Confira o novo total e confirme novamente.',
        409,
      )
    }

    const order: Order = {
      id: `ord-${crypto.randomUUID()}`,
      status: 'pending',
      items,
      payment: {
        walletAddress: wallet.address,
        network: body.network,
        provider: connection.provider,
      },
      ...totals,
      transactionRef: null,
      version: 1,
      createdAt: new Date().toISOString(),
    }

    db.orders[order.id] = order
    db.orderOwners[order.id] = {
      userId: user.id,
      ownerKey: getOwnerKey(request),
      paymentResolvesAt: Date.now() + PAYMENT_PROCESSING_MS,
      // Decidido na criação: o cenário ativo agora define o resultado, mesmo após refresh.
      paymentOutcome: isPaymentDeclined() ? 'declined' : 'confirmed',
    }
    db.idempotency[idempotencyKey] = order.id
    db.idempotencyFingerprints[idempotencyKey] = fingerprint
    persist()
    ensurePaymentResolution(order.id)

    // O pedido já existe; a resposta é que se perde (cliente recupera por idempotência).
    if (isOrderTimeout()) await sleep(ORDER_TIMEOUT_DELAY_MS)

    return json(order, { status: 201 })
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return errorResponse('UNAUTHORIZED', 'Autenticação necessária', 401)
    const orderId = String(params.id)
    const order = getDb().orders[orderId]
    // Pedido de outro usuário responde como inexistente: não revela que existe.
    if (!order || getDb().orderOwners[orderId]?.userId !== user.id) {
      return errorResponse('NOT_FOUND', 'Pedido não encontrado', 404)
    }
    ensurePaymentResolution(orderId)
    return json(getDb().orders[orderId])
  }),
]
