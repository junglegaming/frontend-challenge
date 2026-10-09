import * as s from '@/lib/http/schemas';
import { emitRequestSchema } from '@/lib/socket/events';
import { getDb, mutate } from '../db/store';
import { resetDb } from '../db/reset';
import { getScenario, setScenario } from '../scenarios';
import { emitSocketEvent } from '../sockets/emit';
import { finishOrder } from './orders';
import { clearQuotes } from './quote';
import { route, body, reply, fail, cart, saveCart } from './runtime';
export const controlHandlers = [
  route('post', '/_mock/reset', 'control', () => {
    resetDb();
    clearQuotes();
    setScenario('padrao');
    for (const key of ['gm_session', 'gm_pending_order', 'gm_checkout_draft'])
      globalThis.localStorage?.removeItem(key);
    return reply(s.resetResponseSchema, { ok: true });
  }),
  route('get', '/_mock/scenario', 'control', () =>
    reply(s.scenarioStateSchema, getScenario())
  ),
  route('post', '/_mock/scenario', 'control', async (r) => {
    const data = await body(r, s.setScenarioRequestSchema);
    setScenario(data.id);
    return reply(s.setScenarioResponseSchema, {
      ok: true,
      id: getScenario().id,
    });
  }),
  route('post', '/_mock/emit', 'control', async (r) => {
    const event = {
      ...(await body(r, emitRequestSchema)),
      ts: new Date().toISOString(),
    };
    if (event.type === 'nft.updated') {
      const nft = getDb().nfts.find((n) => n.id === event.resourceId);
      if (!nft) fail(404, 'NOT_FOUND', 'NFT não encontrado');
      if (event.version > nft!.version) {
        mutate((db) => {
          Object.assign(nft!, event.payload, {
            version: event.version,
            updatedAt: event.ts,
          });
          for (const owner of Object.keys(db.carts)) {
            const key = owner as keyof typeof db.carts;
            if (db.carts[key]?.items.some((i) => i.nftId === event.resourceId))
              saveCart(key, cart(key));
          }
        });
      }
    } else {
      const order = getDb().orders.find((o) => o.id === event.resourceId);
      if (!order) fail(404, 'NOT_FOUND', 'Pedido não encontrado');
      if (
        event.version > order!.version &&
        order!.status === 'pending' &&
        event.payload.status !== 'pending'
      ) {
        finishOrder(order!, event.payload.status);
        mutate(() => {
          Object.assign(order!, event.payload, {
            version: event.version,
            updatedAt: event.ts,
          });
        });
      }
    }
    emitSocketEvent(event.type, event);
    return reply(s.resetResponseSchema, { ok: true });
  }),
];
