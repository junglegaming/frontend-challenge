import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  checkoutDraftSchema,
  saveCheckoutDraft,
  restoreCheckoutDraft,
} from '@/features/checkout/draft';
import { signupFormSchema } from '@/features/auth/form-schema';
import { keyFactory } from '@/lib/query/keys';

beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());

test('checkout drafts retain editable fields only and reject invalid or foreign owners', () => {
  const input = {
    userId: 'usr_ana',
    walletId: 'wal_principal',
    network: 'ethereum',
    coupon: 'LAUNCH10',
    total: '99',
    quoteVersion: 12,
  };
  saveCheckoutDraft(checkoutDraftSchema.parse(input));
  expect(restoreCheckoutDraft('usr_ana')).toEqual({
    userId: 'usr_ana',
    walletId: 'wal_principal',
    network: 'ethereum',
    coupon: 'LAUNCH10',
  });
  expect(restoreCheckoutDraft('usr_bruno')).toBeNull();
  expect(localStorage.getItem('gm_checkout_draft')).toBeNull();
  localStorage.setItem('gm_checkout_draft', '{broken');
  expect(restoreCheckoutDraft('usr_ana')).toBeNull();
  expect(localStorage.getItem('gm_checkout_draft')).toBeNull();
});

test('signup confirmation remains a client field and reports mismatch at its input', () => {
  const result = signupFormSchema.safeParse({
    name: 'Carlos',
    email: 'carlos@nft-marketplace.test',
    password: 'Carlos1234',
    confirmPassword: 'Different123',
  });
  expect(result.success).toBe(false);
  if (!result.success)
    expect(result.error.issues[0].path).toEqual(['confirmPassword']);
});

test('private cache identification excludes other users and shared NFT detail', () => {
  for (const key of [
    keyFactory.profile('usr_ana'),
    keyFactory.wallets('usr_ana'),
    keyFactory.order('usr_ana', 'ord_1'),
    keyFactory.cart('usr_ana'),
    keyFactory.quote('usr_ana'),
    keyFactory.favorites.all('usr_ana'),
    keyFactory.nfts.list({}, 'usr_ana'),
  ])
    expect(keyFactory.belongsToUser(key, 'usr_ana')).toBe(true);
  for (const key of [
    keyFactory.profile('usr_bruno'),
    keyFactory.cart('anon'),
    keyFactory.nfts.detail('nft_1'),
  ])
    expect(keyFactory.belongsToUser(key, 'usr_ana')).toBe(false);
});
