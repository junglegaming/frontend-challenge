import { expect } from 'vitest';
import { http } from '@/lib/http/client';
import * as s from '@/lib/http/schemas';
import type { z } from 'zod';
export const anon = {
  'X-Anonymous-Id': '11111111-1111-4111-8111-111111111111',
};
export async function call<T>(
  method: string,
  path: string,
  schema: z.ZodType<T>,
  data?: unknown,
  headers: Record<string, string> = {},
  status = 200
) {
  const response = await http.request({
    method,
    url: `http://localhost/api${path}`,
    data,
    headers,
    validateStatus: () => true,
  });
  expect(response.status).toBe(status);
  return schema.parse(response.data);
}
export const error = (
  method: string,
  path: string,
  code: s.ApiErrorCode,
  status: number,
  data?: unknown,
  headers: Record<string, string> = {}
) =>
  call(method, path, s.errorEnvelopeSchema, data, headers, status).then(
    (result) => {
      expect(result.error.code).toBe(code);
      return result;
    }
  );
export async function login(who = 'ana') {
  const session = await call('post', '/auth/login', s.sessionSchema, {
    email: `${who}@nft-marketplace.test`,
    password: who === 'ana' ? 'Ana12345' : 'Bruno1234',
  });
  return { Authorization: `Bearer ${session.token}` };
}
export const scenario = (id: s.ScenarioId) =>
  call('post', '/_mock/scenario', s.setScenarioResponseSchema, { id });
export const orderKey = '12345678-1234-4123-8123-123456789012';
export async function orderBody(headers: Record<string, string>) {
  const quote = await call('post', '/cart/quote', s.quoteSchema, {}, headers);
  return {
    walletId: 'wal_ana_principal',
    network: 'ethereum',
    quoteVersion: quote.quoteVersion,
  };
}
