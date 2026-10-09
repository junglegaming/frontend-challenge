import { SEED_COUPONS } from './coupons';
import type { MockDb, MockFlags } from '../db/store';
import { SEED_ORDERS } from './orders';
import { SEED_NFTS } from './nfts';
import { SEED_CARTS, SEED_FAVORITES, SEED_USERS } from './users';
import { SEED_WALLETS } from './wallets';

export * from './coupons';
export * from './nfts';
export * from './orders';
export * from './users';
export * from './wallets';

export const createDefaultFlags = (): MockFlags => ({
  forceEmptyCatalog: false,
  forceSessionExpired: false,
  forceForbiddenOrder: false,
  forceSignupConflict: false,
  forceFormValidationError: false,
  forceCouponRejection: false,
  dropStockBeforeConfirm: false,
  armPriceChange: false,
  orderOutcome: null,
});

export const createSeedDb = (): MockDb => ({
  nfts: structuredClone(SEED_NFTS),
  coupons: structuredClone(SEED_COUPONS),
  quoteCoupons: {},
  users: structuredClone(SEED_USERS),
  sessions: [],
  carts: structuredClone(SEED_CARTS),
  favorites: structuredClone(SEED_FAVORITES),
  wallets: structuredClone(SEED_WALLETS),
  orders: structuredClone(SEED_ORDERS),
  idempotency: {},
  quoteVersions: { 'user:usr_ana': 1, 'user:usr_bruno': 1 },
  seq: { order: 0, user: 0, session: 0 },
  flags: createDefaultFlags(),
});
