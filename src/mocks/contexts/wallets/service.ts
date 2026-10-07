import {
  NETWORKS,
  WALLET_PROVIDERS,
  type Network,
  type Wallet,
  type WalletConnection,
  type WalletInput,
  type WalletProvider,
} from '@/domains/wallets'
import type { Clock, Store } from '../../infra/store'
import { DomainError, errors } from '../../http/errors'
import { randomId } from '../../infra/random'
import type { MockState } from '../../state'
import { collect } from '../auth/validation'

const ADDRESS = /^0x[a-fA-F0-9]{40}$/

export class WalletRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  list(userId: string): Wallet[] {
    return this.store.read((s) => structuredClone(s.wallets[userId] ?? []))
  }

  save(userId: string, wallets: Wallet[]) {
    this.store.write((s) => {
      s.wallets[userId] = wallets
    })
  }
}

export class WalletService {
  private readonly repository: WalletRepository
  private readonly clock: Clock
  private readonly rejectsConnections: () => boolean

  constructor(repository: WalletRepository, clock: Clock, rejectsConnections: () => boolean) {
    this.repository = repository
    this.clock = clock
    this.rejectsConnections = rejectsConnections
  }

  list(userId: string) {
    return this.repository.list(userId)
  }

  create(userId: string, input: WalletInput): Wallet {
    this.validate(input)
    const wallets = this.repository.list(userId)
    if (wallets.some((w) => w.slot === input.slot)) {
      throw errors.conflict('Já existe uma carteira cadastrada neste espaço.', {
        slot: input.slot === 'primary' ? 'A carteira principal já está cadastrada.' : 'A carteira secundária já está cadastrada.',
      })
    }
    this.assertUniqueAddress(wallets, input.address)
    const wallet: Wallet = { id: randomId('wal'), ...input, updatedAt: new Date(this.clock.now()).toISOString() }
    this.repository.save(userId, [...wallets, wallet])
    return wallet
  }

  update(userId: string, walletId: string, input: WalletInput): Wallet {
    this.validate(input)
    const wallets = this.repository.list(userId)
    const current = wallets.find((w) => w.id === walletId)
    if (!current) throw errors.notFound('Carteira')
    if (wallets.some((w) => w.id !== walletId && w.slot === input.slot)) {
      throw errors.conflict('Outra carteira já ocupa este espaço.', { slot: 'Outra carteira já ocupa este espaço.' })
    }
    this.assertUniqueAddress(
      wallets.filter((w) => w.id !== walletId),
      input.address,
    )
    const updated: Wallet = { ...current, ...input, updatedAt: new Date(this.clock.now()).toISOString() }
    this.repository.save(
      userId,
      wallets.map((w) => (w.id === walletId ? updated : w)),
    )
    return updated
  }

  find(userId: string, walletId: string): Wallet {
    const wallet = this.repository.list(userId).find((w) => w.id === walletId)
    if (!wallet) throw errors.notFound('Carteira')
    return wallet
  }

  /** Simulated wallet handshake: approves, or rejects when the scenario says so. */
  connect(userId: string, walletId: string, network: string): WalletConnection {
    const wallet = this.find(userId, walletId)
    if (!(NETWORKS as readonly string[]).includes(network) || !wallet.networks.includes(network as Network)) {
      throw errors.validation({ network: 'Esta carteira não suporta a rede selecionada.' })
    }
    if (this.rejectsConnections()) {
      throw new DomainError(422, 'WALLET_REJECTED', 'A conexão foi recusada na carteira.')
    }
    return { walletId, network: network as Network, status: 'connected', connectedAt: new Date(this.clock.now()).toISOString() }
  }

  private validate(input: WalletInput) {
    const fields = collect({
      slot: input.slot === 'primary' || input.slot === 'secondary' ? null : 'Escolha principal ou secundária.',
      label: input.label.trim().length >= 2 && input.label.trim().length <= 40 ? null : 'Use de 2 a 40 caracteres.',
      provider: (WALLET_PROVIDERS as readonly string[]).includes(input.provider) ? null : 'Escolha um provedor válido.',
      address: ADDRESS.test(input.address) ? null : 'Informe um endereço 0x com 40 caracteres hexadecimais.',
      networks:
        input.networks.length > 0 && input.networks.every((n) => (NETWORKS as readonly string[]).includes(n))
          ? null
          : 'Selecione ao menos uma rede.',
    })
    if (Object.keys(fields).length > 0) throw errors.validation(fields)
  }

  private assertUniqueAddress(wallets: Wallet[], address: string) {
    if (wallets.some((w) => w.address.toLowerCase() === address.toLowerCase())) {
      throw errors.conflict('Este endereço já está cadastrado.', { address: 'Este endereço já está cadastrado.' })
    }
  }
}

export const parseWalletInput = (body: Record<string, unknown>): WalletInput => ({
  slot: body.slot === 'secondary' ? 'secondary' : body.slot === 'primary' ? 'primary' : ('' as WalletInput['slot']),
  label: typeof body.label === 'string' ? body.label : '',
  provider: (typeof body.provider === 'string' ? body.provider : '') as WalletProvider,
  address: typeof body.address === 'string' ? body.address.trim() : '',
  networks: Array.isArray(body.networks)
    ? (body.networks.filter((n): n is string => typeof n === 'string') as Network[])
    : [],
})
