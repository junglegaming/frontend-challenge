import { type Db, getDb, persist, resetDb } from './db'
import { dropRealtimeConnections, emitNftUpdated, emitOrderUpdated } from './realtime'
import { disconnectAllWallets } from './wallet-connections'

/**
 * Cenários determinísticos do backend simulado. Selecionados por
 * `?scenario=<nome>` na URL ou por `window.__kurio.applyScenario(nome)`.
 */
export const SCENARIOS = [
  'default',
  'empty',
  'slow',
  'latency',
  'offline',
  'server_error',
  'price_changed',
  'sold_out',
  'session_expired',
  'order_timeout',
  'payment_declined',
  'favorite_error',
  'wallet_rejected',
  'wallet_disconnected',
] as const
export type ScenarioName = (typeof SCENARIOS)[number]

/** Atraso de `slow`: suficiente para observar skeletons. */
const SLOW_LATENCY_MS = 2500

/**
 * Latências de `latency`, em sequência cíclica: a primeira requisição é a mais
 * lenta, então respostas chegam fora da ordem de envio — de forma reproduzível.
 */
const VARIABLE_LATENCY_MS = [1200, 150, 600, 300] as const

/**
 * Atraso da resposta em `order_timeout`: maior que o timeout do cliente HTTP
 * (10 s), então o pedido é criado mas a resposta não chega a tempo.
 */
export const ORDER_TIMEOUT_DELAY_MS = 12_000

type ScenarioState = {
  fixedLatencyMs: number
  variableLatency: boolean
  offline: boolean
  serverError: boolean
  orderTimeout: boolean
  paymentDeclined: boolean
  favoriteError: boolean
  walletRejected: boolean
}

const INITIAL_STATE: ScenarioState = {
  fixedLatencyMs: 0,
  variableLatency: false,
  offline: false,
  serverError: false,
  orderTimeout: false,
  paymentDeclined: false,
  favoriteError: false,
  walletRejected: false,
}

let state: ScenarioState = { ...INITIAL_STATE }
let latencyCursor = 0

/**
 * Aplica as condições de rede do cenário ativo a uma requisição REST.
 *
 * @returns Resposta de falha a devolver, ou `null` para seguir com o handler.
 * @example
 * const failure = await simulateNetwork()
 * if (failure) return failure
 */
export async function simulateNetwork(): Promise<Response | null> {
  if (state.offline) return Response.error()
  const wait = state.variableLatency
    ? VARIABLE_LATENCY_MS[latencyCursor++ % VARIABLE_LATENCY_MS.length]
    : state.fixedLatencyMs
  if (wait && wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  if (state.serverError) {
    return new Response(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'Serviço temporariamente indisponível' },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
  return null
}

/** Pedido criado com resposta atrasada além do timeout do cliente. */
export function isOrderTimeout(): boolean {
  return state.orderTimeout
}

/** Pagamento simulado como recusado. */
export function isPaymentDeclined(): boolean {
  return state.paymentDeclined
}

/** Mutations de favoritos falham com 5xx. */
export function isFavoriteError(): boolean {
  return state.favoriteError
}

/** A carteira recusa o pedido de conexão. */
export function isWalletRejected(): boolean {
  return state.walletRejected
}

/** Altera um NFT, persiste e publica `nft.updated` — REST e evento sempre juntos. */
function updateNft(db: Db, nftId: string, change: (nft: Db['nfts'][number]) => void): void {
  const nft = db.nfts.find((n) => n.id === nftId)
  if (!nft) return
  change(nft)
  nft.version += 1
  persist()
  emitNftUpdated({ nftId: nft.id, version: nft.version, priceEth: nft.priceEth })
}

/** NFT afetado pelos cenários de compra: o mesmo usado nos fluxos de teste. */
const PURCHASE_SCENARIO_NFT_ID = 'nft-1'

/**
 * Ativa um cenário. Cada chamada parte do estado padrão, então cenários não se
 * acumulam. Nomes desconhecidos equivalem a `default`.
 *
 * @param name - Nome do cenário (ver {@link SCENARIOS}).
 */
export function applyScenario(name: string | null): void {
  state = { ...INITIAL_STATE }
  latencyCursor = 0
  const db = getDb()

  switch (name) {
    case 'empty':
      db.nfts = []
      persist()
      break
    case 'slow':
      state.fixedLatencyMs = SLOW_LATENCY_MS
      break
    case 'latency':
      state.variableLatency = true
      break
    case 'offline':
      state.offline = true
      break
    case 'server_error':
      state.serverError = true
      break
    case 'price_changed':
      updateNft(db, PURCHASE_SCENARIO_NFT_ID, (nft) => {
        nft.priceEth = '2.99'
      })
      break
    case 'sold_out':
      updateNft(db, PURCHASE_SCENARIO_NFT_ID, (nft) => {
        for (const edition of nft.editions) edition.available = 0
      })
      break
    case 'session_expired': {
      const expired = new Date(Date.now() - 1000).toISOString()
      for (const session of Object.values(db.sessions)) session.expiresAt = expired
      persist()
      break
    }
    case 'order_timeout':
      state.orderTimeout = true
      break
    case 'payment_declined':
      state.paymentDeclined = true
      break
    case 'favorite_error':
      state.favoriteError = true
      break
    case 'wallet_rejected':
      state.walletRejected = true
      break
    case 'wallet_disconnected':
      disconnectAllWallets()
      break
    default:
      break
  }
}

export function parseScenarioFromUrl(): { scenario: string | null; reset: boolean } {
  const url = new URL(window.location.href)
  return {
    scenario: url.searchParams.get('scenario'),
    reset: url.searchParams.get('reset') === '1',
  }
}

export function applyUrlControls(): void {
  const { scenario, reset } = parseScenarioFromUrl()
  if (reset) resetDb()
  applyScenario(scenario)
}

/** Restaura o seed e o cenário padrão — estado conhecido para demos e testes. */
function resetAll(): void {
  resetDb()
  applyScenario('default')
  disconnectAllWallets()
}

declare global {
  interface Window {
    __kurio?: {
      reset: () => void
      applyScenario: typeof applyScenario
      scenarios: typeof SCENARIOS
      emitNftUpdated: typeof emitNftUpdated
      emitOrderUpdated: typeof emitOrderUpdated
      dropRealtimeConnections: typeof dropRealtimeConnections
    }
  }
}

/** API de controle exposta em `window.__kurio` para demonstração e testes E2E. */
export function exposeControl(): void {
  window.__kurio = {
    reset: resetAll,
    applyScenario,
    scenarios: SCENARIOS,
    emitNftUpdated,
    emitOrderUpdated,
    dropRealtimeConnections,
  }
}
