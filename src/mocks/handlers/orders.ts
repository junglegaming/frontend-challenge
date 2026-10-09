import * as s from '@/lib/http/schemas';
import { getDb, mutate, type StoredOrder } from '../db/store';
import {
  schedule,
  isTimerPending,
  type TimerHandle,
} from '../scenarios/timers';
import { sleep, scenarioIs } from '../scenarios';
import { dropStockBeforeConfirm } from '../scenarios/hooks';
import { emitSocketEvent } from '../sockets/emit';
import { quote } from './quote';
import {
  route,
  user,
  body,
  parse,
  reply,
  fail,
  cart,
  saveCart,
} from './runtime';
export function finishOrder(
  order: StoredOrder,
  status: 'confirmed' | 'declined'
) {
  if (order.status !== 'pending') return;
  if (
    status === 'confirmed' &&
    order.items.some(
      (item) =>
        (getDb().nfts.find((n) => n.id === item.nftId)?.available ?? 0) <
        item.qty
    )
  )
    status = 'declined';
  mutate((db) => {
    order.status = status;
    order.version++;
    order.updatedAt = new Date().toISOString();
    if (status === 'confirmed') {
      order.txHash = `0x${order.id.replace(/\D/g, '').padStart(64, '0')}`;
      order.explorerUrl = `https://example.invalid/tx/${order.txHash}`;
      const key = `user:${order.userId}` as const;
      const current = cart(key);
      for (const item of order.items) {
        const entry = current.items.find((i) => i.nftId === item.nftId);
        if (entry) entry.qty -= item.qty;
        const nft = db.nfts.find((n) => n.id === item.nftId)!;
        nft.available = Math.max(0, nft.available - item.qty);
        nft.version++;
        nft.updatedAt = order.updatedAt;
        emitSocketEvent('nft.updated', {
          type: 'nft.updated',
          resourceId: nft.id,
          version: nft.version,
          ts: nft.updatedAt,
          payload: {
            price: nft.price,
            previousPrice: nft.previousPrice ?? nft.price,
            available: nft.available,
          },
        });
        for (const owner of Object.keys(db.carts)) {
          const key = owner as keyof typeof db.carts;
          if (db.carts[key]?.items.some((i) => i.nftId === nft.id)) {
            db.carts[key]!.version++;
            db.quoteVersions[key] = (db.quoteVersions[key] ?? 1) + 1;
          }
        }
      }
      current.items = current.items.filter((i) => i.qty > 0);
      saveCart(key, current);
    } else order.declineReason = 'Transação recusada pela carteira';
  });
  emitSocketEvent('order.updated', {
    type: 'order.updated',
    resourceId: order.id,
    version: order.version,
    ts: order.updatedAt,
    payload: {
      status: order.status,
      txHash: order.txHash,
      explorerUrl: order.explorerUrl,
      declineReason: order.declineReason,
    },
  });
}
const orderTimers = new Map<string, TimerHandle>();
function armOrder(order: StoredOrder) {
  if (order.status !== 'pending') return;
  const existing = orderTimers.get(order.id);
  if (existing && isTimerPending(existing)) return;
  const outcome = scenarioIs('pagamento-recusado') ? 'declined' : 'confirmed';
  orderTimers.set(
    order.id,
    schedule(() => {
      if (getDb().orders.includes(order)) finishOrder(order, outcome);
    }, 3000)
  );
}
export const orderHandlers = [
  route('post', '/orders', 'orders', async (r) => {
    const current = user(r);
    const data = await body(r, s.createOrderRequestSchema);
    const key = parse(s.idempotencyKeySchema, r.headers.get('Idempotency-Key'));
    const hash = JSON.stringify({
      ...data,
      coupon: data.coupon?.trim().toUpperCase() ?? null,
    });
    const recordKey = `${current.id}:${key}`;
    const previous = getDb().idempotency[recordKey];
    if (previous) {
      if (previous.payloadHash !== hash)
        fail(409, 'IDEMPOTENCY_CONFLICT', 'Conteúdo divergente');
      const order = getDb().orders.find((o) => o.id === previous.orderId)!;
      armOrder(order);
      armOrder(order!);
      return reply(s.orderSchema, order);
    }
    const wallet = getDb().wallets.find((w) => w.id === data.walletId);
    if (!wallet) fail(404, 'NOT_FOUND', 'Carteira não encontrada');
    if (wallet!.userId !== current.id)
      fail(403, 'FORBIDDEN', 'Carteira de outro usuário');
    if (wallet!.network !== data.network)
      fail(422, 'VALIDATION_ERROR', 'Rede incompatível', {
        network: ['Rede incompatível'],
      });
    const owner = `user:${current.id}` as const;
    if (getDb().flags.dropStockBeforeConfirm)
      dropStockBeforeConfirm(cart(owner).items[0]?.nftId);
    const summary = quote(owner, data.coupon);
    if (summary.quoteVersion !== data.quoteVersion)
      fail(409, 'QUOTE_STALE', 'Cotação desatualizada');
    const order = mutate((db) => {
      const order: StoredOrder = {
        ...summary,
        id: `ord_${++db.seq.order}`,
        userId: current.id,
        status: 'pending',
        items: structuredClone(
          cart(owner).items.map((i) => ({
            nftId: i.nftId,
            name: i.name,
            image: i.image,
            edition: i.edition,
            qty: i.qty,
            unitPrice: i.price,
            lineTotal: i.lineTotal,
          }))
        ),
        wallet: {
          id: wallet!.id,
          label: wallet!.label,
          address: wallet!.address,
          provider: wallet!.provider,
          ensName: wallet!.ensName,
          secondaryIdentity: wallet!.secondaryIdentity,
          note: wallet!.note,
        },
        collector: {
          name: current.name,
          email: current.email,
          username: current.username,
          profileName: current.profileName,
          referralCode: current.referralCode,
        },
        network: data.network,
        idempotencyKey: key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      db.orders.push(order);
      db.idempotency[recordKey] = {
        key,
        userId: current.id,
        payloadHash: hash,
        orderId: order.id,
      };
      return order;
    });
    emitSocketEvent('order.updated', {
      type: 'order.updated',
      resourceId: order.id,
      version: order.version,
      ts: order.updatedAt,
      payload: { status: 'pending' },
    });
    armOrder(order);
    const response = reply(s.orderSchema, order, 201);
    if (scenarioIs('timeout-pedido')) await sleep(15000);
    return response;
  }),
  route('get', '/orders/:id', 'orders', (r, p) => {
    const current = user(r);
    const order = getDb().orders.find((o) => o.id === p.id);
    if (!order) fail(404, 'NOT_FOUND', 'Pedido não encontrado');
    if (order!.userId !== current.id)
      fail(403, 'FORBIDDEN', 'Pedido de outro usuário');
    armOrder(order!);
    return reply(s.orderSchema, order);
  }),
];
