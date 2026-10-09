import type {
  Cart,
  Coupon,
  Nft,
  Order,
  UserPublic,
  Wallet,
} from '@/lib/http/schemas';
import { createSeedDb } from '../fixtures';
import { clearStorage, loadDb, saveDb } from './persist';

export type OwnerKey = `user:${string}` | `anon:${string}`;

export type MockUser = UserPublic & { passwordHash: string };

export type SessionRecord = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type StoredWallet = Wallet & { userId: string };

export type StoredOrder = Order & { userId: string };

export type IdempotencyRecord = {
  key: string;
  userId: string;
  payloadHash: string;
  orderId: string;
};

export type MockFlags = {
  forceEmptyCatalog: boolean;
  forceSessionExpired: boolean;
  forceForbiddenOrder: boolean;
  forceSignupConflict: boolean;
  forceFormValidationError: boolean;
  forceCouponRejection: boolean;
  dropStockBeforeConfirm: boolean;
  armPriceChange: boolean;
  orderOutcome: string | null;
};

export type MockSeq = {
  order: number;
  user: number;
  session: number;
};

export type MockDb = {
  nfts: Nft[];
  coupons: Coupon[];
  quoteCoupons: Partial<Record<OwnerKey, string | null>>;
  users: MockUser[];
  sessions: SessionRecord[];
  carts: Partial<Record<OwnerKey, Cart>>;
  favorites: Partial<Record<OwnerKey, string[]>>;
  wallets: StoredWallet[];
  orders: StoredOrder[];
  idempotency: Record<string, IdempotencyRecord>;
  quoteVersions: Partial<Record<OwnerKey, number>>;
  seq: MockSeq;
  flags: MockFlags;
};

let cachedDb: MockDb | undefined;

const hydrateDb = (): MockDb => {
  const seed = createSeedDb();
  const parsed = loadDb();
  if (!parsed) {
    saveDb(seed);
    return seed;
  }
  const seedNfts = new Map(seed.nfts.map((nft) => [nft.id, nft]));
  const legacyDetail =
    parsed.nfts.length > 0 &&
    parsed.nfts.every((nft) => nft.tokenId === undefined);
  // Persisted catalogs from before network filters lack the new fixture fields.
  // Keep user state and mutable NFT values while upgrading those records once.
  const nfts = parsed.nfts.map((nft) => {
    const reference = seedNfts.get(nft.id);
    if (nft.network !== undefined && !legacyDetail) return nft;
    return {
      ...(legacyDetail ? reference : {}),
      ...nft,
      ...(legacyDetail
        ? {
            tokenId: reference?.tokenId,
            details: reference?.details,
            images: reference?.images ?? nft.images,
          }
        : {}),
      network: nft.network ?? reference?.network ?? 'ethereum',
      categories: [
        ...new Set([...nft.categories, ...(reference?.categories ?? [])]),
      ],
    };
  });
  if (legacyDetail && !nfts.some((nft) => nft.id === 'emerald-ape-042'))
    nfts.push(seedNfts.get('emerald-ape-042')!);
  const hydrated = {
    ...seed,
    ...parsed,
    nfts,
    seq: { ...seed.seq, ...parsed.seq },
    flags: { ...seed.flags, ...parsed.flags },
  };
  saveDb(hydrated);
  return hydrated;
};

export const getDb = (): MockDb => {
  if (!cachedDb) cachedDb = hydrateDb();
  return cachedDb;
};

export const replaceDb = (next: MockDb): MockDb => {
  cachedDb = next;
  saveDb(next);
  return next;
};

export const clearDb = (): void => {
  cachedDb = undefined;
  clearStorage();
};

export const mutate = <T>(fn: (db: MockDb) => T): T => {
  const db = getDb();
  try {
    const result = fn(db);
    if (result instanceof Promise) throw new Error('mutate exige fn síncrono');
    return result;
  } finally {
    saveDb(getDb());
  }
};

export const ownerOf = (
  userId?: string | null,
  anonId?: string | null
): OwnerKey | undefined => {
  if (userId) return `user:${userId}`;
  if (anonId) return `anon:${anonId}`;
  return undefined;
};

export const toUserPublic = (user: MockUser): UserPublic => {
  const { passwordHash, ...publicUser } = user;
  void passwordHash;
  return publicUser;
};

const EMPTY_CART_UPDATED_AT = '1970-01-01T00:00:00.000Z';
export const emptyCart = (updatedAt?: string): Cart => ({
  items: [],
  subtotal: '0',
  itemCount: 0,
  updatedAt: updatedAt ?? EMPTY_CART_UPDATED_AT,
  version: 1,
});

export const quoteVersionOf = (ownerKey: OwnerKey): number =>
  getDb().quoteVersions[ownerKey] ?? 1;

export const bumpQuoteVersion = (ownerKey: OwnerKey): number =>
  mutate((db) => {
    const next = (db.quoteVersions[ownerKey] ?? 1) + 1;
    db.quoteVersions[ownerKey] = next;
    return next;
  });
