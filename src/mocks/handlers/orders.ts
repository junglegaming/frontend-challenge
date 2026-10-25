import { delay, http, HttpResponse } from 'msw'
import { createOrderInputSchema } from '@/schemas/order'
import { quoteInputSchema } from '@/schemas/quote'
import { WALLET_PROVIDER_LABELS } from '@/schemas/wallet'
import { db, type DbOrder } from '../db'
import { buildQuote, DomainError, ensureCart, isQuoteStale } from '../domain'
import { scheduleOrder, triggerCartScenario } from '../effects'
import { API, apiError, parseBody, requireUser, route } from '../http'
import { uid } from '../random'
import { getScenario } from '../scenarios'

function findWallet(userId: string, walletId: string) {
  const wallet = db.state.wallets.find((item) => item.id === walletId && item.userId === userId)
  if (!wallet) throw new DomainError(404, 'NOT_FOUND', 'Carteira não encontrada')
  return wallet
}

function fakeTxHash() {
  return `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export const orderHandlers = [
  http.post(
    `${API}/quote`,
    route(async ({ request }) => {
      const user = requireUser(request)
      const input = await parseBody(request, quoteInputSchema)
      findWallet(user.id, input.walletId)
      const quote = db.update((state) => {
        const cart = ensureCart(state, `user:${user.id}`)
        const created = buildQuote(state, cart, input.network, input.walletId)
        state.quotes = [...state.quotes.filter((item) => item.userId !== user.id), { quote: created, userId: user.id, cartId: cart.id }]
        return created
      })
      triggerCartScenario(quote.items[0])
      return HttpResponse.json(quote)
    }),
  ),

  http.post(
    `${API}/orders`,
    route(async ({ request }) => {
      const user = requireUser(request)
      const key = request.headers.get('Idempotency-Key')
      if (!key || key.length < 8) return apiError(400, 'VALIDATION_ERROR', 'Idempotency-Key obrigatório')
      const input = await parseBody(request, createOrderInputSchema)
      const requestHash = JSON.stringify(input)

      // Mesma tentativa → mesmo pedido; mesma chave com outro conteúdo → conflito.
      const previous = db.state.orders.find((item) => item.userId === user.id && item.idempotencyKey === key)
      if (previous) {
        if (previous.requestHash !== requestHash) return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outros dados')
        return HttpResponse.json(previous.order)
      }

      const wallet = findWallet(user.id, input.walletId)
      if (!wallet.connected) return apiError(403, 'FORBIDDEN', 'Conecte a carteira antes de confirmar a compra')

      const record = db.update((state) => {
        const stored = state.quotes.find((item) => item.quote.id === input.quoteId && item.userId === user.id)
        if (!stored) throw new DomainError(404, 'NOT_FOUND', 'Cotação não encontrada. Revise o pedido novamente.')
        const cart = ensureCart(state, `user:${user.id}`)
        const check = isQuoteStale(state, cart, stored.quote)
        if (check.stale) {
          if (check.fresh) state.quotes = [...state.quotes.filter((item) => item.userId !== user.id), { quote: check.fresh, userId: user.id, cartId: cart.id }]
          throw new DomainError(409, 'QUOTE_STALE', 'Preço, disponibilidade ou taxas mudaram. Revise e confirme novamente.', { quote: check.fresh })
        }
        const quote = stored.quote
        const created: DbOrder = {
          userId: user.id,
          quoteId: quote.id,
          walletId: wallet.id,
          idempotencyKey: key,
          requestHash,
          outcome: getScenario() === 'payment-rejected' ? 'reject' : 'confirm',
          resolveAt: Date.now() + 2500,
          order: {
            id: uid('ord'),
            status: 'pending',
            confirmedAt: null,
            rejectionReason: null,
            version: 1,
            receipt: {
              items: quote.items,
              subtotal: quote.subtotal,
              discount: quote.discount,
              networkFee: quote.networkFee,
              total: quote.total,
              couponCode: quote.coupon?.code ?? null,
              network: quote.network,
              walletLabel: WALLET_PROVIDER_LABELS[wallet.provider],
              txHash: '',
              explorerUrl: '',
              createdAt: new Date().toISOString(),
            },
          },
        }
        const txHash = fakeTxHash()
        created.order.receipt.txHash = txHash
        created.order.receipt.explorerUrl = `https://etherscan.io/tx/${txHash}`
        state.orders.push(created)
        state.quotes = state.quotes.filter((item) => item.quote.id !== quote.id)
        return created
      })
      scheduleOrder(record.order.id)

      // order-timeout: o pedido já existe, mas a resposta só chega depois do timeout do cliente.
      if (getScenario() === 'order-timeout') await delay(10_000)
      return HttpResponse.json(record.order, { status: 201 })
    }),
  ),

  http.get(
    `${API}/orders/:orderId`,
    route(({ request, params }) => {
      const user = requireUser(request)
      const record = db.state.orders.find((item) => item.order.id === params.orderId && item.userId === user.id)
      if (!record) return apiError(404, 'NOT_FOUND', 'Pedido não encontrado')
      return HttpResponse.json(record.order)
    }),
  ),
]
