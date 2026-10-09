import { test, expect } from 'vitest';
import * as s from '@/lib/http/schemas';
import { http } from '@/lib/http/client';
import { call, error, login, scenario } from './helpers';
test('signup normalizes email and conflicts, validates fields', async () => {
  const result = await call(
    'post',
    '/auth/signup',
    s.sessionSchema,
    { name: 'Carlos', email: 'CARLOS@nft-marketplace.test', password: 'Carlos1234' },
    {},
    201
  );
  expect(result.user.email).toBe('carlos@nft-marketplace.test');
  await error('post', '/auth/signup', 'CONFLICT', 409, {
    name: 'Carlos',
    email: 'carlos@nft-marketplace.test',
    password: 'Carlos1234',
  });
  await error('post', '/auth/signup', 'VALIDATION_ERROR', 422, {});
});
test('login session logout and invalid credentials', async () => {
  const headers = await login();
  await call('get', '/auth/session', s.sessionSchema, undefined, headers);
  expect(
    (await http.post('http://localhost/api/auth/logout', {}, { headers }))
      .status
  ).toBe(204);
  await error('get', '/auth/session', 'UNAUTHORIZED', 401, undefined, headers);
  await error('post', '/auth/login', 'UNAUTHORIZED', 401, {
    email: 'ana@nft-marketplace.test',
    password: 'wrong',
  });
});
test('expired session', async () => {
  await scenario('sessao-expirada');
  const headers = await login();
  await error(
    'get',
    '/auth/session',
    'SESSION_EXPIRED',
    401,
    undefined,
    headers
  );
});

test('signup supports remote field validation scenario', async () => {
  await scenario('validacao-api');
  const failure = await error('post', '/auth/signup', 'VALIDATION_ERROR', 422, {
    name: 'Carlos',
    email: 'carlos@nft-marketplace.test',
    password: 'Carlos1234',
  });
  expect(failure.error.fields?.email).toEqual(['E-mail rejeitado pela API']);
});
