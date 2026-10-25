import { http, HttpResponse } from 'msw'
import { changePasswordInputSchema, updateProfileInputSchema } from '@/schemas/profile'
import { walletInputSchema, walletSchema, type Wallet } from '@/schemas/wallet'
import { db } from '../db'
import { DomainError } from '../domain'
import type { DbUser, DbWallet } from '../fixtures'
import { API, apiError, hashPassword, parseBody, requireUser, route } from '../http'
import { uid } from '../random'
import { getScenario } from '../scenarios'

function toProfile(user: DbUser) {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatar: user.avatar,
  }
}

function toWallet(wallet: DbWallet): Wallet {
  return walletSchema.parse(wallet)
}

function ownWallet(userId: string, walletId: string) {
  const wallet = db.state.wallets.find((item) => item.id === walletId && item.userId === userId)
  if (!wallet) throw new DomainError(404, 'NOT_FOUND', 'Carteira não encontrada')
  return wallet
}

export const accountHandlers = [
  http.get(
    `${API}/profile`,
    route(({ request }) => HttpResponse.json(toProfile(requireUser(request)))),
  ),

  http.patch(
    `${API}/profile`,
    route(async ({ request }) => {
      const user = requireUser(request)
      const input = await parseBody(request, updateProfileInputSchema)
      const email = input.email.toLowerCase()
      const others = db.state.users.filter((item) => item.id !== user.id)
      if (others.some((item) => item.email === email)) {
        return apiError(409, 'EMAIL_TAKEN', 'E-mail já usado por outra conta', { fields: { email: 'Este e-mail já está cadastrado' } })
      }
      if (others.some((item) => item.username.toLowerCase() === input.username.toLowerCase())) {
        return apiError(409, 'USERNAME_TAKEN', 'Nome de usuário indisponível', { fields: { username: 'Este nome de usuário já está em uso' } })
      }
      const updated = db.update((state) => {
        const target = state.users.find((item) => item.id === user.id)!
        Object.assign(target, {
          displayName: input.displayName,
          username: input.username,
          email,
          ensName: input.ensName,
          walletNickname: input.walletNickname,
          avatar: input.avatar === undefined ? target.avatar : input.avatar,
        })
        return target
      })
      return HttpResponse.json(toProfile(updated))
    }),
  ),

  http.post(
    `${API}/profile/password`,
    route(async ({ request }) => {
      const user = requireUser(request)
      const input = await parseBody(request, changePasswordInputSchema)
      if ((await hashPassword(user.salt, input.currentPassword)) !== user.passwordHash) {
        return apiError(422, 'INVALID_CREDENTIALS', 'Senha atual incorreta', { fields: { currentPassword: 'Senha atual incorreta' } })
      }
      const salt = uid('salt')
      const passwordHash = await hashPassword(salt, input.newPassword)
      db.update((state) => {
        Object.assign(state.users.find((item) => item.id === user.id)!, { salt, passwordHash })
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    `${API}/wallets`,
    route(({ request }) => {
      const user = requireUser(request)
      return HttpResponse.json({ wallets: db.state.wallets.filter((item) => item.userId === user.id).map(toWallet) })
    }),
  ),

  http.post(
    `${API}/wallets`,
    route(async ({ request }) => {
      const user = requireUser(request)
      const input = await parseBody(request, walletInputSchema)
      if (db.state.wallets.some((item) => item.userId === user.id && item.slot === input.slot)) {
        return apiError(409, 'VALIDATION_ERROR', 'Já existe uma carteira neste espaço', { fields: { slot: 'Edite a carteira existente' } })
      }
      const wallet: DbWallet = { ...input, id: uid('w'), userId: user.id, connected: false, updatedAt: new Date().toISOString() }
      db.update((state) => {
        state.wallets.push(wallet)
      })
      return HttpResponse.json(toWallet(wallet), { status: 201 })
    }),
  ),

  http.patch(
    `${API}/wallets/:walletId`,
    route(async ({ request, params }) => {
      const user = requireUser(request)
      const input = await parseBody(request, walletInputSchema.omit({ slot: true }))
      ownWallet(user.id, String(params.walletId))
      const wallet = db.update((state) => {
        const target = state.wallets.find((item) => item.id === params.walletId)!
        // Trocar endereço ou rede exige nova conexão.
        const reconnect = target.address !== input.address || target.network !== input.network
        Object.assign(target, input, { updatedAt: new Date().toISOString(), connected: reconnect ? false : target.connected })
        return target
      })
      return HttpResponse.json(toWallet(wallet))
    }),
  ),

  http.post(
    `${API}/wallets/:walletId/connect`,
    route(({ request, params }) => {
      const user = requireUser(request)
      ownWallet(user.id, String(params.walletId))
      if (getScenario() === 'wallet-rejected') return apiError(403, 'WALLET_REJECTED', 'A conexão foi recusada na carteira')
      const wallet = db.update((state) => {
        const target = state.wallets.find((item) => item.id === params.walletId)!
        target.connected = true
        return target
      })
      return HttpResponse.json(toWallet(wallet))
    }),
  ),

  http.post(
    `${API}/wallets/:walletId/disconnect`,
    route(({ request, params }) => {
      const user = requireUser(request)
      ownWallet(user.id, String(params.walletId))
      const wallet = db.update((state) => {
        const target = state.wallets.find((item) => item.id === params.walletId)!
        target.connected = false
        return target
      })
      return HttpResponse.json(toWallet(wallet))
    }),
  ),
]
