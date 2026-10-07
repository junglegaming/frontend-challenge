import Decimal from 'decimal.js'
import type { CollectorDetails, CreateOrderRequest, Order } from '@/domains/orders'
import type { Network } from '@/domains/wallets'
import type { Clock, Store } from '../../infra/store'
import { DomainError, errors } from '../../http/errors'
import { fingerprint, randomHex, randomId } from '../../infra/random'
import { createEvent, type EventPublisher } from '../../realtime/publisher'
import type { MockState, OrderRecord } from '../../state'
import { collect, validateEmail } from '../auth/validation'
import type { CartService } from '../cart/service'
import { userCartId } from '../cart/service'
import type { CatalogService } from '../catalog/service'
import type { WalletService } from '../wallets/service'

const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  arbitrum: 'https://arbiscan.io/tx/',
  base: 'https://basescan.org/tx/',
}

/** Scenario-driven knobs, injected so the service doesn't know about scenarios (DIP). */
export interface OrderPolicy {
  settleDelayMs(): number
  paymentOutcome(): 'confirmed' | 'declined'
  /** Applied once, right before an order is validated (simulates a change during checkout). */
  beforeValidation(userId: string): void
}

export class OrderRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  find(orderId: string): OrderRecord | null {
    return this.store.read((s) => structuredClone(s.orders[orderId]) ?? null)
  }

  findByIdempotencyKey(userId: string, key: string): OrderRecord | null {
    const orderId = this.store.read((s) => s.idempotency[`${userId}:${key}`])
    return orderId ? this.find(orderId) : null
  }

  pending(): OrderRecord[] {
    return this.store.read((s) => Object.values(s.orders).filter((o) => o.status === 'pending').map((o) => structuredClone(o)))
  }

  insert(order: OrderRecord) {
    this.store.write((s) => {
      s.orders[order.id] = order
      s.idempotency[`${order.userId}:${order.idempotencyKey}`] = order.id
    })
  }

  update(orderId: string, patch: Partial<OrderRecord>): OrderRecord | null {
    return this.store.write((s) => {
      const order = s.orders[orderId]
      if (!order) return null
      Object.assign(order, patch)
      return structuredClone(order)
    })
  }
}

const toOrder = (record: OrderRecord): Order => {
  const { userId: _u, idempotencyKey: _k, requestFingerprint: _f, settleAt: _s, outcome: _o, ...order } = record
  return order
}

export class OrderService {
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  private readonly orders: OrderRepository
  private readonly carts: CartService
  private readonly catalog: CatalogService
  private readonly wallets: WalletService
  private readonly publisher: EventPublisher
  private readonly clock: Clock
  private readonly policy: OrderPolicy

  constructor(
    orders: OrderRepository,
    carts: CartService,
    catalog: CatalogService,
    wallets: WalletService,
    publisher: EventPublisher,
    clock: Clock,
    policy: OrderPolicy,
  ) {
    this.orders = orders
    this.carts = carts
    this.catalog = catalog
    this.wallets = wallets
    this.publisher = publisher
    this.clock = clock
    this.policy = policy
  }

  /**
   * Idempotent creation. Same key + same payload → same order (no duplicate purchase);
   * same key + different payload → IDEMPOTENCY_CONFLICT. Revalidates quote and stock.
   */
  create(userId: string, idempotencyKey: string, request: CreateOrderRequest): { order: Order; replayed: boolean } {
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(idempotencyKey)) {
      throw errors.validation({ idempotencyKey: 'Cabeçalho Idempotency-Key ausente ou inválido.' })
    }
    const requestFingerprint = fingerprint(request)
    const existing = this.orders.findByIdempotencyKey(userId, idempotencyKey)
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) {
        throw new DomainError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave de idempotência já foi usada com outro pedido.')
      }
      return { order: toOrder(this.settleIfDue(existing)), replayed: true }
    }

    this.validateCollector(request.collector)
    const wallet = this.wallets.find(userId, request.walletId)
    if (!wallet.networks.includes(request.network)) {
      throw errors.validation({ network: 'A carteira selecionada não suporta esta rede.' })
    }

    this.policy.beforeValidation(userId)
    const quote = this.carts.quote(userCartId(userId), request.network)
    if (quote.lines.length === 0) throw errors.validation({ cart: 'Seu carrinho está vazio.' })
    if (!quote.purchasable) {
      throw errors.availability('Alguns itens não estão mais disponíveis na quantidade escolhida.', { quote })
    }
    if (quote.signature !== request.quoteSignature) {
      throw new DomainError(409, 'QUOTE_STALE', 'Os valores do pedido mudaram. Revise e confirme novamente.', undefined, {
        quote,
      })
    }

    const now = this.clock.now()
    const record: OrderRecord = {
      id: randomId('ord'),
      status: 'pending',
      version: 1,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      network: request.network,
      wallet: { id: wallet.id, label: wallet.label, provider: wallet.provider, address: wallet.address },
      collector: request.collector,
      lines: quote.lines.map(({ itemId: _id, ...line }) => line),
      coupon: quote.coupon,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      transaction: null,
      declineReason: null,
      userId,
      idempotencyKey,
      requestFingerprint,
      settleAt: now + this.policy.settleDelayMs(),
      outcome: this.policy.paymentOutcome(),
    }
    this.orders.insert(record)
    // Reserve stock while the payment is pending (broadcasts nft.updated).
    this.catalog.adjustStock(record.lines.map((l) => ({ nftId: l.nftId, editionId: l.editionId, delta: -l.quantity })))
    this.schedule(record)
    return { order: toOrder(record), replayed: false }
  }

  get(userId: string, orderId: string): Order {
    const record = this.orders.find(orderId)
    if (!record) throw errors.notFound('Pedido')
    if (record.userId !== userId) throw errors.forbidden()
    return toOrder(this.settleIfDue(record))
  }

  /** Re-arms timers for pending orders after a page reload (timers don't survive it). */
  resumePending() {
    this.orders.pending().forEach((order) => this.schedule(order))
  }

  /** Test/scenario control: settles every pending order immediately. */
  settleAllNow() {
    this.orders.pending().forEach((order) => this.settle(order))
  }

  private schedule(order: OrderRecord) {
    if (this.timers.has(order.id)) return
    const wait = Math.max(0, order.settleAt - this.clock.now())
    this.timers.set(
      order.id,
      setTimeout(() => {
        this.timers.delete(order.id)
        const current = this.orders.find(order.id)
        if (current?.status === 'pending') this.settle(current)
      }, wait),
    )
  }

  private settleIfDue(order: OrderRecord): OrderRecord {
    return order.status === 'pending' && order.settleAt <= this.clock.now() ? this.settle(order) : order
  }

  /** Terminal transition: confirmed (cart decremented) or declined (stock released). */
  private settle(order: OrderRecord): OrderRecord {
    const timer = this.timers.get(order.id)
    if (timer) clearTimeout(timer)
    this.timers.delete(order.id)

    const confirmed = order.outcome === 'confirmed'
    const updated = this.orders.update(order.id, {
      status: confirmed ? 'confirmed' : 'declined',
      version: order.version + 1,
      updatedAt: new Date(this.clock.now()).toISOString(),
      transaction: confirmed
        ? (() => {
            const hash = `0x${randomHex(32)}`
            return { hash, explorerUrl: `${EXPLORERS[order.network]}${hash}` }
          })()
        : null,
      declineReason: confirmed ? null : 'Pagamento recusado pela carteira (simulação).',
    })
    if (!updated) return order

    if (confirmed) {
      this.carts.subtractPurchased(order.userId, order.lines)
    } else {
      this.catalog.adjustStock(order.lines.map((l) => ({ nftId: l.nftId, editionId: l.editionId, delta: l.quantity })))
    }

    this.publisher.publish(
      createEvent('order.updated', { type: 'order', id: updated.id }, updated.version, {
        orderId: updated.id,
        userId: updated.userId,
        status: updated.status,
        transaction: updated.transaction,
        declineReason: updated.declineReason,
      }),
      { kind: 'user', userId: updated.userId },
    )
    return updated
  }

  private validateCollector(collector: CollectorDetails) {
    const fields = collect({
      'collector.fullName': collector.fullName.trim().length >= 3 ? null : 'Informe o nome completo.',
      'collector.email': validateEmail(collector.email),
      'collector.country': collector.country.trim() ? null : 'Selecione o país.',
    })
    if (Object.keys(fields).length > 0) throw errors.validation(fields)
  }
}

export const isPositive = (value: string) => new Decimal(value).greaterThan(0)
