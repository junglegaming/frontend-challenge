import { HttpResponse, delay, http } from 'msw'
import type { ZodError } from 'zod'

import type {
  ChangePasswordRequest,
  Profile,
  UpdateProfileRequest,
  Wallet,
} from '@/shared/contracts'
import {
  connectWalletRequestSchema,
  createWalletRequestSchema,
  updateWalletRequestSchema,
} from '@/shared/contracts'

import { getDb, hashPassword, persist } from '../db'
import { isWalletRejected, simulateNetwork } from '../scenarios'
import { errorResponse, getAuthenticatedUser, unauthorized } from '../utils'
import { closeWalletConnection, openWalletConnection } from '../wallet-connections'

/** Tempo da "aprovação" na extensão de carteira simulada. */
const WALLET_APPROVAL_MS = 600

/** Erros de validação do corpo, campo a campo (exibidos no formulário). */
function walletValidationError(error: ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !fields[field]) fields[field] = issue.message
  }
  return errorResponse('VALIDATION_ERROR', 'Confira os dados da carteira', 422, fields)
}

function duplicateAddressError() {
  return errorResponse('CONFLICT', 'Esta carteira já está cadastrada', 409, {
    address: 'Este endereço já está cadastrado em outra carteira sua.',
  })
}

export const accountHandlers = [
  http.get('/api/profile', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const profile: Profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    }
    return HttpResponse.json(profile)
  }),

  http.patch('/api/profile', async ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const body = (await request.json()) as UpdateProfileRequest
    if (!body.name || body.name.length < 2) {
      return errorResponse('VALIDATION_ERROR', 'Nome deve ter ao menos 2 caracteres', 422, {
        name: 'Mínimo de 2 caracteres',
      })
    }

    user.name = body.name
    if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl
    persist()

    const profile: Profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    }
    return HttpResponse.json(profile)
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const body = (await request.json()) as ChangePasswordRequest
    if (hashPassword(body.currentPassword) !== user.passwordHash) {
      return errorResponse('VALIDATION_ERROR', 'Senha atual incorreta', 422, {
        currentPassword: 'Senha atual incorreta',
      })
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return errorResponse('VALIDATION_ERROR', 'A nova senha deve ter ao menos 6 caracteres', 422, {
        newPassword: 'Mínimo de 6 caracteres',
      })
    }

    user.passwordHash = hashPassword(body.newPassword)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/wallets', ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()
    return HttpResponse.json(getDb().wallets[user.id] ?? [])
  }),

  http.post('/api/wallets', async ({ request }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const parsed = createWalletRequestSchema.safeParse(await request.json())
    if (!parsed.success) return walletValidationError(parsed.error)
    const body = parsed.data
    const db = getDb()
    const wallets = db.wallets[user.id] ?? []
    if (wallets.some((w) => w.address.toLowerCase() === body.address.toLowerCase())) {
      return duplicateAddressError()
    }

    // A primeira carteira é sempre a principal; pedir principal rebaixa a atual.
    const isPrimary = wallets.length === 0 || body.isPrimary === true
    if (isPrimary) for (const w of wallets) w.isPrimary = false
    const wallet: Wallet = {
      id: `w-${crypto.randomUUID()}`,
      address: body.address,
      network: body.network,
      label: body.label,
      isPrimary,
      provider: body.provider,
      ensName: body.ensName,
      referralCode: body.referralCode,
    }
    wallets.push(wallet)
    db.wallets[user.id] = wallets
    persist()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const parsed = updateWalletRequestSchema.safeParse(await request.json())
    if (!parsed.success) return walletValidationError(parsed.error)
    const body = parsed.data
    const db = getDb()
    const wallets = db.wallets[user.id] ?? []
    const wallet = wallets.find((w) => w.id === params.id)
    if (!wallet) return errorResponse('NOT_FOUND', 'Carteira não encontrada', 404)
    if (
      body.address !== undefined &&
      wallets.some(
        (w) => w.id !== wallet.id && w.address.toLowerCase() === body.address?.toLowerCase(),
      )
    ) {
      return duplicateAddressError()
    }

    if (body.address !== undefined) wallet.address = body.address
    if (body.network !== undefined) wallet.network = body.network
    if (body.label !== undefined) wallet.label = body.label
    if (body.provider !== undefined) wallet.provider = body.provider
    if (body.ensName !== undefined) wallet.ensName = body.ensName
    if (body.referralCode !== undefined) wallet.referralCode = body.referralCode
    if (body.isPrimary === true) {
      for (const w of wallets) w.isPrimary = false
      wallet.isPrimary = true
    }

    db.wallets[user.id] = wallets
    persist()
    return HttpResponse.json(wallet)
  }),

  /** Conexão simulada: a "extensão" aprova ou recusa (cenário `wallet_rejected`). */
  http.post('/api/wallets/:id/connect', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const parsed = connectWalletRequestSchema.safeParse(await request.json())
    if (!parsed.success) return errorResponse('VALIDATION_ERROR', 'Conexão inválida', 422)
    const wallet = (getDb().wallets[user.id] ?? []).find((w) => w.id === params.id)
    if (!wallet) return errorResponse('NOT_FOUND', 'Carteira não encontrada', 404)

    await delay(WALLET_APPROVAL_MS)
    if (isWalletRejected()) {
      return errorResponse('WALLET_REJECTED', 'A conexão foi recusada na carteira.', 409)
    }
    const connection = openWalletConnection(user.id, {
      walletId: wallet.id,
      address: wallet.address,
      network: parsed.data.network,
      provider: parsed.data.provider,
    })
    return HttpResponse.json(connection)
  }),

  http.delete('/api/wallets/connections/:connectionId', ({ request, params }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()
    closeWalletConnection(user.id, String(params.connectionId))
    return new HttpResponse(null, { status: 204 })
  }),
]
