import * as s from '@/lib/http/schemas';
import { getDb, mutate } from '../db/store';
import { route, user, reply, fail } from './runtime';
export const favoritesHandlers = ['get', 'put', 'delete'].map((method) =>
  route(
    method as 'get' | 'put' | 'delete',
    method === 'get' ? '/favorites' : '/favorites/:nftId',
    'favorites',
    (request, params) => {
      const key = `user:${user(request).id}` as const;
      if (method !== 'get' && !getDb().nfts.some((n) => n.id === params.nftId))
        fail(404, 'NOT_FOUND', 'NFT não encontrado');
      const ids = mutate((db) => {
        const ids = (db.favorites[key] ??= []);
        const id = String(params.nftId);
        if (method === 'put' && !ids.includes(id)) ids.push(id);
        if (method === 'delete')
          db.favorites[key] = ids.filter((i) => i !== id);
        return db.favorites[key] ?? ids;
      });
      return reply(s.favoritesResponseSchema, { ids, count: ids.length });
    }
  )
);
