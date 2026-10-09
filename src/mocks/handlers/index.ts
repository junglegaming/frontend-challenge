import { http, HttpResponse } from 'msw';
import { sessionHandlers } from './session';
import { nftHandlers } from './nfts';
import { favoritesHandlers } from './favorites';
import { cartHandlers } from './cart';
import { quoteHandlers } from './quote';
import { orderHandlers } from './orders';
import { profileHandlers } from './profile';
import { walletHandlers } from './wallets';
import { controlHandlers } from './mock-control';
export const handlers = [
  http.get('*/api/_health', () => HttpResponse.json({ ok: true })),
  ...controlHandlers,
  ...sessionHandlers,
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
];
