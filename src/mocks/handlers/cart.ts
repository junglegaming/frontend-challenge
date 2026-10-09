import * as s from '@/lib/http/schemas';
import { getDb } from '../db/store';
import { mulQty } from '@/lib/money';
import { route, owner, cart, saveCart, reply, body, fail } from './runtime';
export const cartHandlers = [
  route('get', '/cart', 'cart', (r) => reply(s.cartSchema, cart(owner(r)))),
  ...(['post', 'patch', 'delete'] as const).map((method) =>
    route(
      method,
      method === 'post' ? '/cart/items' : '/cart/items/:nftId',
      'cart',
      async (r, p) => {
        const key = owner(r);
        const current = cart(key);
        const data =
          method === 'delete'
            ? null
            : method === 'post'
              ? await body(r, s.addCartItemRequestSchema)
              : await body(r, s.patchCartItemRequestSchema);
        const id =
          data && 'nftId' in data ? String(data.nftId) : String(p.nftId);
        const existing = current.items.find((i) => i.nftId === id);
        const nft = getDb().nfts.find((n) => n.id === id);
        if (!nft || (method !== 'post' && !existing))
          fail(404, 'NOT_FOUND', 'Item não encontrado');
        if (method === 'delete')
          current.items = current.items.filter((i) => i.nftId !== id);
        else {
          const qty =
            data!.qty + (method === 'post' ? (existing?.qty ?? 0) : 0);
          if (qty > nft!.available)
            fail(409, 'INSUFFICIENT_STOCK', 'Quantidade indisponível');
          if (existing) existing.qty = qty;
          else
            current.items.push({
              nftId: id,
              tokenId: nft!.tokenId,
              name: nft!.name,
              image: nft!.image,
              price: nft!.price,
              qty,
              available: nft!.available,
              edition: { ...nft!.edition },
              lineTotal: mulQty(nft!.price, qty),
              updatedAt: new Date().toISOString(),
            });
        }
        saveCart(key, current);
        return reply(s.cartSchema, cart(key), method === 'post' ? 201 : 200);
      }
    )
  ),
];
