import * as s from '@/lib/http/schemas';
import { addEth, subEth, percentOf } from '@/lib/money';

import { getDb, mutate, quoteVersionOf, type OwnerKey } from '../db/store';
import { armPriceChange } from '../scenarios/hooks';
import { route, body, reply, owner, cart, fail } from './runtime';
export function clearQuotes() {
  mutate((db) => {
    db.quoteCoupons = {};
  });
}
export function coupon(code?: string | null) {
  if (!code) return null;
  const found = getDb().coupons.find(
    (c) => c.code === code.trim().toUpperCase()
  );
  if (!found) return fail(422, 'COUPON_INVALID', 'Cupom inválido');
  if (found.expiresAt && Date.parse(found.expiresAt) <= Date.now())
    fail(410, 'COUPON_EXPIRED', 'Cupom expirado');
  if (getDb().flags.forceCouponRejection)
    return fail(422, 'COUPON_INVALID', 'Cupom inválido');
  return found;
}
export function quote(key: OwnerKey, code?: string | null) {
  const current = cart(key);
  if (!current.items.length)
    fail(422, 'VALIDATION_ERROR', 'Carrinho vazio', {
      form: ['Carrinho vazio'],
    });
  if (current.items.some((i) => i.qty > i.available))
    fail(409, 'INSUFFICIENT_STOCK', 'Estoque insuficiente');
  const discountCoupon = coupon(code);
  const normalized = discountCoupon?.code ?? null;
  if (key in getDb().quoteCoupons && getDb().quoteCoupons[key] !== normalized)
    mutate((db) => {
      db.quoteVersions[key] = (db.quoteVersions[key] ?? 1) + 1;
    });
  mutate((db) => {
    db.quoteCoupons[key] = normalized;
  });
  const discount = discountCoupon
    ? percentOf(current.subtotal, discountCoupon.value)
    : '0';
  return s.quoteSchema.parse({
    subtotal: current.subtotal,
    discount,
    networkFee: '0.0042',
    total: addEth(subEth(current.subtotal, discount), '0.0042'),
    currency: 'ETH',
    coupon: discountCoupon,
    quoteVersion: quoteVersionOf(key),
    items: current.items.map((i) => ({
      nftId: i.nftId,
      qty: i.qty,
      unitPrice: i.price,
      available: i.available,
    })),
    available: true,
    updatedAt: new Date().toISOString(),
  });
}
export const quoteHandlers = [
  route('post', '/cart/quote', 'quote', async (r) => {
    const key = owner(r);
    const data = await body(r, s.quoteRequestSchema);
    const result = quote(key, data.coupon);
    if (
      getDb().flags.armPriceChange &&
      cart(key).items.some((i) => i.nftId === 'golden-signal-160')
    )
      armPriceChange();
    return reply(s.quoteSchema, result);
  }),
  route('post', '/coupons/validate', 'coupons', async (r) => {
    owner(r);
    const data = await body(r, s.couponValidateRequestSchema);
    return reply(s.couponValidateResponseSchema, { coupon: coupon(data.code) });
  }),
];
