import type { DefaultBodyType } from 'msw';
import { HttpResponse } from 'msw';
import type { RequestKind, LatencyFn } from './types';
import { err, fnv1a } from '../handlers/_shared';
import { scenarioIs, sleep } from './index';

export const BASE_LATENCY: Record<RequestKind, number> = {
  control: 0,
  auth: 200,
  list: 300,
  detail: 250,
  favorites: 150,
  cart: 180,
  quote: 200,
  coupons: 150,
  orders: 400,
  profile: 200,
  wallets: 200,
  other: 150,
};

const clamp = (min: number, value: number, max: number): number =>
  Math.min(Math.max(min, value), max);

const pageOf = (url: URL): number => {
  const raw = Number(url.searchParams.get('page') ?? '1');
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
};

export const latency: LatencyFn = (kind, url, method) => {
  if (kind === 'control') return 0;
  if (scenarioIs('lento')) return 3000;
  if (scenarioIs('latencia-varia')) {
    const seed = fnv1a(`${method.toUpperCase()}${url.href}`);
    if (kind === 'list') {
      return clamp(200, 2400 - (pageOf(url) - 1) * 600 + (seed % 400), 2500);
    }
    return 200 + (seed % 800);
  }
  return BASE_LATENCY[kind];
};

export const gate = async (
  kind: RequestKind,
  request: Request
): Promise<HttpResponse<DefaultBodyType> | undefined> => {
  if (kind === 'control') return undefined;
  if (scenarioIs('offline')) return HttpResponse.error();
  const url = new URL(request.url);
  await sleep(latency(kind, url, request.method));
  if (scenarioIs('erro-5xx') && (kind === 'list' || kind === 'detail')) {
    return err(500, 'INTERNAL', 'Erro interno ao processar a solicitação');
  }
  if (scenarioIs('erro-4xx') && kind === 'detail') {
    return err(404, 'NOT_FOUND', 'Recurso não encontrado');
  }
  return undefined;
};
