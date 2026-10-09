import type { Nft, ScenarioId } from '@/lib/http/schemas';
import type { NftUpdated } from '@/lib/socket/events';
import { addEth, mulQty } from '@/lib/money';
import { createDefaultFlags } from '../fixtures';
import type { MockDb, MockFlags, OwnerKey } from '../db/store';
import { bumpQuoteVersion, mutate } from '../db/store';
import { emitSocketEvent } from '../sockets/emit';
import { scenarioIs } from './index';
import { isTimerPending, schedule } from './timers';

const SCENARIO_FLAGS: Partial<Record<ScenarioId, Partial<MockFlags>>> = {
  vazio: { forceEmptyCatalog: true },
  'sessao-expirada': { forceSessionExpired: true },
  'nao-autorizado': { forceForbiddenOrder: true },
  'cadastro-conflito': { forceSignupConflict: true },
  'validacao-api': { forceFormValidationError: true },
  'cupom-ruim': { forceCouponRejection: true },
  'preco-muda': { armPriceChange: true },
  'estoque-esgotado': { dropStockBeforeConfirm: true },
  'pagamento-confirmado': { orderOutcome: 'confirmed' },
  'pagamento-recusado': { orderOutcome: 'declined' },
  'timeout-pedido': { orderOutcome: 'timeout' },
};

export const applyScenarioFlags = (id: ScenarioId): void => {
  mutate((db) => {
    db.flags = { ...createDefaultFlags(), ...SCENARIO_FLAGS[id] };
  });
};

type ForceFlagKey =
  | 'forceEmptyCatalog'
  | 'forceSessionExpired'
  | 'forceForbiddenOrder'
  | 'forceSignupConflict'
  | 'forceFormValidationError'
  | 'forceCouponRejection';

const forceFlag = (key: ForceFlagKey): void => {
  mutate((db) => {
    db.flags[key] = true;
  });
};

export const forceEmptyCatalog = (): void => forceFlag('forceEmptyCatalog');

export const forceSessionExpired = (): void => forceFlag('forceSessionExpired');

export const forceForbiddenOrder = (): void => forceFlag('forceForbiddenOrder');

export const forceSignupConflict = (): void => forceFlag('forceSignupConflict');

export const forceFormValidationError = (): void =>
  forceFlag('forceFormValidationError');

export const forceCouponRejection = (): void =>
  forceFlag('forceCouponRejection');

export const setOrderOutcome = (outcome: MockFlags['orderOutcome']): void => {
  mutate((db) => {
    db.flags.orderOutcome = outcome;
  });
};

const toNftEvent = (nft: Nft, ts: string): NftUpdated => ({
  type: 'nft.updated',
  resourceId: nft.id,
  version: nft.version,
  ts,
  payload: {
    price: nft.price,
    available: nft.available,
    previousPrice: nft.previousPrice ?? nft.price,
  },
});

const syncCartsForNft = (db: MockDb, nft: Nft, ts: string): void => {
  for (const owner of Object.keys(db.carts) as OwnerKey[]) {
    const cart = db.carts[owner];
    if (!cart) continue;
    const item = cart.items.find((entry) => entry.nftId === nft.id);
    if (!item) continue;
    item.price = nft.price;
    item.available = nft.available;
    item.lineTotal = mulQty(nft.price, item.qty);
    item.updatedAt = ts;
    cart.subtotal = cart.items.reduce(
      (total, entry) => addEth(total, entry.lineTotal),
      '0'
    );
    cart.updatedAt = ts;
    cart.version += 1;
    bumpQuoteVersion(owner);
  }
};

export const dropStockBeforeConfirm = (nftId: string): void => {
  const event = mutate((db): NftUpdated | undefined => {
    const nft = db.nfts.find((item) => item.id === nftId);
    if (!nft || nft.available === 0) return undefined;
    nft.available = 0;
    nft.version += 1;
    const ts = new Date().toISOString();
    nft.updatedAt = ts;
    syncCartsForNft(db, nft, ts);
    return toNftEvent(nft, ts);
  });
  if (event) emitSocketEvent('nft.updated', event);
};

const PRICE_CHANGE_NFT_ID = 'golden-signal-160';
const PRICE_CHANGE_DELAY_MS = 6000;

let armedTimer: ReturnType<typeof schedule> | undefined;

export const armPriceChange = (): void => {
  if (armedTimer !== undefined && isTimerPending(armedTimer)) return;
  armedTimer = schedule(() => {
    if (!scenarioIs('preco-muda')) return;
    const event = mutate((db): NftUpdated | undefined => {
      const nft = db.nfts.find((item) => item.id === PRICE_CHANGE_NFT_ID);
      if (!nft || nft.price !== '0.99') return undefined;
      const ts = new Date().toISOString();
      nft.updatedAt = ts;
      nft.previousPrice = nft.price;
      nft.price = '1.19';
      nft.available = 5;
      nft.version += 1;
      syncCartsForNft(db, nft, ts);
      return toNftEvent(nft, ts);
    });
    if (event) emitSocketEvent('nft.updated', event);
  }, PRICE_CHANGE_DELAY_MS);
};
