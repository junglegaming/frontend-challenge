import { test, expect } from 'vitest';
import * as s from '@/lib/http/schemas';
import { call, error, login, anon, scenario } from './helpers';
test('quote precise totals and coupons', async () => {
  const headers = await login();
  const quote = await call(
    'post',
    '/cart/quote',
    s.quoteSchema,
    { coupon: 'launch10' },
    headers
  );
  expect(quote).toMatchObject({
    subtotal: '1.03',
    discount: '0.103',
    networkFee: '0.0042',
    total: '0.9312',
  });
  await call(
    'post',
    '/coupons/validate',
    s.couponValidateResponseSchema,
    { code: 'green5' },
    headers
  );
  await error(
    'post',
    '/cart/quote',
    'COUPON_INVALID',
    422,
    { coupon: 'FAKE' },
    headers
  );
  await error(
    'post',
    '/coupons/validate',
    'COUPON_EXPIRED',
    410,
    { code: 'EXPIRED' },
    headers
  );
  await error('post', '/cart/quote', 'VALIDATION_ERROR', 422, {}, anon);
});

test('cupom-ruim rejects valid codes and preserves expiration errors', async () => {
  await scenario('cupom-ruim');
  await error(
    'post',
    '/coupons/validate',
    'COUPON_INVALID',
    422,
    { code: 'LAUNCH10' },
    anon
  );
  await error(
    'post',
    '/coupons/validate',
    'COUPON_EXPIRED',
    410,
    { code: 'EXPIRED' },
    anon
  );
});
