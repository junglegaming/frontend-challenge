import { http, HttpResponse } from 'msw'
import { loginInputSchema, registerInputSchema, type User } from '@/schemas/auth'
import { db } from '../db'
import type { DbUser } from '../fixtures'
import { API, apiError, getToken, hashPassword, parseBody, requireUser, route } from '../http'
import { uid } from '../random'
import { getScenario } from '../scenarios'

function toPublicUser(user: DbUser): User {
  return { id: user.id, username: user.username, displayName: user.displayName, email: user.email, avatar: user.avatar }
}

function createSession(userId: string): string {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '')
  const ttl = getScenario() === 'session-expired' ? 20_000 : 30 * 60_000
  db.update((state) => {
    state.sessions.push({ token, userId, expiresAt: Date.now() + ttl })
  })
  return token
}

export const authHandlers = [
  http.post(
    `${API}/auth/register`,
    route(async ({ request }) => {
      const input = await parseBody(request, registerInputSchema)
      const email = input.email.toLowerCase()
      const fields: Record<string, string> = {}
      if (db.state.users.some((user) => user.email === email)) fields.email = 'Este e-mail já está cadastrado'
      if (db.state.users.some((user) => user.username.toLowerCase() === input.username.toLowerCase())) fields.username = 'Este nome de usuário já está em uso'
      if (fields.email) return apiError(409, 'EMAIL_TAKEN', 'Já existe uma conta com este e-mail', { fields })
      if (fields.username) return apiError(409, 'USERNAME_TAKEN', 'Nome de usuário indisponível', { fields })

      const salt = uid('salt')
      const user: DbUser = {
        id: uid('u'),
        username: input.username,
        displayName: input.username,
        email,
        salt,
        passwordHash: await hashPassword(salt, input.password),
        avatar: null,
        ensName: input.username.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        walletNickname: 'Minha carteira',
      }
      db.update((state) => {
        state.users.push(user)
      })
      return HttpResponse.json({ user: toPublicUser(user), token: createSession(user.id) }, { status: 201 })
    }),
  ),

  http.post(
    `${API}/auth/login`,
    route(async ({ request }) => {
      const input = await parseBody(request, loginInputSchema)
      const user = db.state.users.find((item) => item.email === input.email.toLowerCase())
      if (!user || (await hashPassword(user.salt, input.password)) !== user.passwordHash) {
        return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos')
      }
      return HttpResponse.json({ user: toPublicUser(user), token: createSession(user.id) })
    }),
  ),

  http.get(
    `${API}/auth/session`,
    route(({ request }) => HttpResponse.json({ user: toPublicUser(requireUser(request)) })),
  ),

  http.post(
    `${API}/auth/logout`,
    route(({ request }) => {
      const token = getToken(request)
      db.update((state) => {
        state.sessions = state.sessions.filter((session) => session.token !== token)
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
