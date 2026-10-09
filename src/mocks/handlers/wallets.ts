import * as s from '@/lib/http/schemas';
import { getDb, mutate } from '../db/store';
import { route, user, body, reply, fail } from './runtime';
export const walletHandlers = [
  route('get', '/wallets', 'wallets', (r) =>
    reply(s.walletsListResponseSchema, {
      items: getDb().wallets.filter((w) => w.userId === user(r).id),
    })
  ),
  ...(['post', 'patch'] as const).map((method) =>
    route(
      method,
      method === 'post' ? '/wallets' : '/wallets/:id',
      'wallets',
      async (r, p) => {
        const current = user(r);
        const data =
          method === 'post'
            ? await body(r, s.createWalletRequestSchema)
            : await body(r, s.patchWalletRequestSchema.strict());
        if (getDb().flags.forceFormValidationError)
          fail(422, 'VALIDATION_ERROR', 'Validação remota', {
            label: ['Nome rejeitado'],
          });
        const wallets = getDb().wallets.filter((w) => w.userId === current.id);
        let existing = getDb().wallets.find((w) => w.id === p.id);
        if (method === 'patch') {
          if (!existing) fail(404, 'NOT_FOUND', 'Carteira não encontrada');
          if (existing!.userId !== current.id)
            fail(403, 'FORBIDDEN', 'Carteira de outro usuário');
          if (
            ((data.network && data.network !== existing!.network) ||
              ('address' in data &&
                data.address !== undefined &&
                data.address !== existing!.address) ||
              ('provider' in data &&
                data.provider !== undefined &&
                data.provider !== (existing!.provider ?? 'metamask'))) &&
            getDb().orders.some(
              (o) => o.status === 'pending' && o.wallet.id === existing!.id
            )
          )
            fail(409, 'CONFLICT', 'Carteira vinculada a pedido pendente');
          if (
            'address' in data &&
            wallets.some(
              (w) =>
                w.id !== existing!.id &&
                w.address.toLowerCase() === String(data.address).toLowerCase()
            )
          )
            fail(409, 'CONFLICT', 'Endereço já cadastrado', {
              address: ['Endereço já cadastrado'],
            });
        } else {
          if (wallets.length >= 2)
            fail(409, 'CONFLICT', 'Limite de duas carteiras atingido', {
              form: ['Limite de duas carteiras atingido'],
            });
          if (
            'address' in data &&
            wallets.some(
              (w) =>
                w.address.toLowerCase() === String(data.address).toLowerCase()
            )
          )
            fail(409, 'CONFLICT', 'Endereço já cadastrado', {
              address: ['Endereço já cadastrado'],
            });
        }
        mutate((db) => {
          if (data.isPrimary)
            wallets.forEach((w) => {
              w.isPrimary = false;
            });
          if (existing) Object.assign(existing, data);
          else {
            existing = {
              ...s.createWalletRequestSchema.parse(data),
              id: `wal_${current.id}_${wallets.length + 1}`,
              userId: current.id,
              createdAt: new Date().toISOString(),
            };
            db.wallets.push(existing);
          }
        });
        return reply(s.walletSchema, existing, method === 'post' ? 201 : 200);
      }
    )
  ),
];
