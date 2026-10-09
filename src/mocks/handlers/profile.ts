import * as s from '@/lib/http/schemas';
import { getDb, mutate, toUserPublic } from '../db/store';
import { pseudoHash } from '../fixtures/users';
import { route, user, body, reply, fail } from './runtime';
const profile = (id: string) => ({
  ...toUserPublic(getDb().users.find((u) => u.id === id)!),
  walletCount: getDb().wallets.filter((w) => w.userId === id).length,
});
export const profileHandlers = [
  route('get', '/profile', 'profile', (r) =>
    reply(s.profileSchema, profile(user(r).id))
  ),
  route('patch', '/profile', 'profile', async (r) => {
    const current = user(r);
    const data = await body(r, s.profilePatchSchema);
    if (data.email) {
      data.email = data.email.toLowerCase();
      if (
        getDb().users.some(
          (u) => u.id !== current.id && u.email.toLowerCase() === data.email
        )
      )
        fail(409, 'CONFLICT', 'E-mail já cadastrado', {
          email: ['E-mail já cadastrado'],
        });
    }
    if (getDb().flags.forceFormValidationError)
      fail(422, 'VALIDATION_ERROR', 'Validação remota', {
        name: ['Nome rejeitado pela API'],
      });
    if (
      data.username &&
      getDb().users.some(
        (u) =>
          u.id !== current.id &&
          u.username?.toLowerCase() === data.username?.toLowerCase()
      )
    )
      fail(409, 'CONFLICT', 'Username em uso', {
        username: ['Username em uso'],
      });
    mutate(() => {
      const { avatarUrl, ...fields } = data;
      Object.assign(current, fields);
      if (avatarUrl === null) delete current.avatarUrl;
      else if (avatarUrl !== undefined) current.avatarUrl = avatarUrl;
    });
    return reply(s.profileSchema, profile(current.id));
  }),
  route('post', '/profile/password', 'profile', async (r) => {
    const current = user(r);
    const data = await body(r, s.passwordRequestSchema);
    if (
      getDb().flags.forceFormValidationError ||
      current.passwordHash !== `hash:${pseudoHash(data.currentPassword)}`
    )
      fail(422, 'VALIDATION_ERROR', 'Senha atual incorreta', {
        currentPassword: ['Senha atual incorreta'],
      });
    mutate(() => {
      current.passwordHash = `hash:${pseudoHash(data.newPassword)}`;
    });
    return new Response(null, { status: 204 });
  }),
];
