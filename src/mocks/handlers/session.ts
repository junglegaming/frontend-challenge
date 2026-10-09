import * as s from '@/lib/http/schemas';
import { mutate, getDb, emptyCart } from '../db/store';
import { pseudoHash } from '../fixtures/users';
import {
  route,
  body,
  reply,
  user,
  publicUser,
  fail,
  cart,
  saveCart,
} from './runtime';
function session(userId: string) {
  return mutate((db) => {
    const token = `mock.${btoa(`${userId}:${++db.seq.session}`)}`;
    const record = {
      token,
      userId,
      expiresAt: new Date(
        Date.now() + (db.flags.forceSessionExpired ? 0 : 7200000)
      ).toISOString(),
    };
    db.sessions.push(record);
    return {
      ...record,
      user: publicUser(db.users.find((u) => u.id === userId)!),
    };
  });
}
export const sessionHandlers = [
  route('post', '/auth/signup', 'auth', async (request) => {
    const data = await body(request, s.signupRequestSchema);
    if (getDb().flags.forceFormValidationError)
      fail(422, 'VALIDATION_ERROR', 'Validação remota', {
        email: ['E-mail rejeitado pela API'],
      });
    const email = data.email.toLowerCase();
    if (getDb().users.some((u) => u.email === email))
      fail(409, 'CONFLICT', 'E-mail já cadastrado', {
        email: ['E-mail já cadastrado'],
      });
    const id = mutate((db) => {
      const id = `usr_${++db.seq.user}`;
      db.users.push({
        id,
        name: data.name,
        email,
        passwordHash: `hash:${pseudoHash(data.password)}`,
        createdAt: new Date().toISOString(),
      });
      return id;
    });
    return reply(s.sessionSchema, session(id), 201);
  }),
  route('post', '/auth/login', 'auth', async (request) => {
    const data = await body(request, s.loginRequestSchema);
    const found = getDb().users.find(
      (u) =>
        u.email === data.email.toLowerCase() &&
        u.passwordHash === `hash:${pseudoHash(data.password)}`
    );
    if (!found) return fail(401, 'UNAUTHORIZED', 'E-mail ou senha incorretos');
    if (data.anonymousId) {
      const target = cart(`user:${found.id}`);
      const source = cart(`anon:${data.anonymousId}`);
      for (const item of source.items) {
        const existing = target.items.find((i) => i.nftId === item.nftId);
        if (existing)
          existing.qty = Math.min(existing.qty + item.qty, item.available);
        else
          target.items.push({
            ...item,
            qty: Math.min(item.qty, item.available),
          });
      }
      target.items = target.items.filter((i) => i.qty > 0);
      saveCart(`user:${found.id}`, target);
      mutate((db) => {
        db.carts[`anon:${data.anonymousId}`] = emptyCart();
      });
    }
    return reply(s.sessionSchema, session(found.id));
  }),
  route('get', '/auth/session', 'auth', (request) => {
    const current = user(request);
    const record = getDb().sessions.find(
      (s) => s.token === request.headers.get('Authorization')?.slice(7)
    )!;
    return reply(s.sessionSchema, { ...record, user: publicUser(current) });
  }),
  route('post', '/auth/logout', 'auth', (request) => {
    mutate((db) => {
      db.sessions = db.sessions.filter(
        (s) => s.token !== request.headers.get('Authorization')?.slice(7)
      );
    });
    return new Response(null, { status: 204 });
  }),
];
