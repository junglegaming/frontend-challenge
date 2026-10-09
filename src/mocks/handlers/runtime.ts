import { http, HttpResponse, type JsonBodyType } from 'msw';
import { z } from 'zod';
import { gate } from '../scenarios/gate';
import type { RequestKind } from '../scenarios/types';
import {
  getDb,
  mutate,
  emptyCart,
  toUserPublic,
  type OwnerKey,
} from '../db/store';
import { err } from './_shared';
import { addEth, mulQty } from '@/lib/money';
export class Failure {
  response: Response;
  constructor(response: Response) {
    this.response = response;
  }
}
export function fail(
  status: number,
  code: Parameters<typeof err>[1],
  message: string,
  fields?: Record<string, string[]>
): never {
  throw new Failure(err(status, code, message, fields));
}
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues)
    (fields[String(issue.path[0] ?? 'form')] ??= []).push(issue.message);
  return fail(422, 'VALIDATION_ERROR', 'Dados inválidos', fields);
}
export async function body<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<T> {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    fail(422, 'VALIDATION_ERROR', 'JSON inválido', { form: ['JSON inválido'] });
  }
  return parse(schema, data);
}
export function reply<T>(schema: z.ZodType<T>, data: unknown, status = 200) {
  return HttpResponse.json(schema.parse(data) as JsonBodyType, { status });
}
export function user(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  const db = getDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return fail(401, 'UNAUTHORIZED', 'Sessão inválida');
  if (
    db.flags.forceSessionExpired ||
    Date.parse(session.expiresAt) <= Date.now()
  )
    return fail(401, 'SESSION_EXPIRED', 'Sessão expirada');
  return db.users.find((u) => u.id === session.userId)!;
}
export function owner(request: Request): OwnerKey {
  if (request.headers.has('Authorization')) return `user:${user(request).id}`;
  const id = parse(z.uuid(), request.headers.get('X-Anonymous-Id'));
  return `anon:${id}`;
}
export function cart(key: OwnerKey) {
  const stored = getDb().carts[key] ?? emptyCart();
  const items = stored.items.map((item) => {
    const nft = getDb().nfts.find((n) => n.id === item.nftId)!;
    return {
      ...item,
      tokenId: nft.tokenId,
      price: nft.price,
      available: nft.available,
      lineTotal: mulQty(nft.price, item.qty),
    };
  });
  return {
    ...stored,
    items,
    subtotal: items.reduce((sum, i) => addEth(sum, i.lineTotal), '0'),
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
  };
}
export function saveCart(key: OwnerKey, value: ReturnType<typeof cart>) {
  mutate((db) => {
    value.version++;
    value.updatedAt = new Date().toISOString();
    db.carts[key] = value;
    db.quoteVersions[key] = (db.quoteVersions[key] ?? 1) + 1;
  });
}
export const publicUser = toUserPublic;
export function route(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  kind: RequestKind,
  run: (
    request: Request,
    params: Record<string, string | readonly string[] | undefined>
  ) => unknown
) {
  return http[method](`*/api${path}`, async ({ request, params }) => {
    const blocked = await gate(kind, request);
    if (blocked) return blocked;
    try {
      return (await run(request, params)) as Response;
    } catch (error) {
      if (error instanceof Failure) return error.response;
      throw error;
    }
  });
}
