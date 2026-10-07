import type { ApiErrorCode } from '@/shared/api/contracts'

export interface FailureRule {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | '*'
  /** Matched against the pathname, e.g. `^/api/nfts`. */
  path: string
  status: number
  code: ApiErrorCode
  message: string
  /** How many matching requests fail before recovering. Omit to fail forever. */
  times?: number
}

export type LatencyProfile =
  | { kind: 'range'; minMs: number; maxMs: number }
  /** Odd requests are slow, even requests are fast — forces responses to arrive out of order. */
  | { kind: 'alternating'; slowMs: number; fastMs: number }

export interface ScenarioDefinition {
  id: string
  label: string
  description: string
  latency: LatencyProfile
  offline?: boolean
  failures?: FailureRule[]
  emptyCatalog?: boolean
  sessionTtlMs?: number
  /** Time between order creation and payment settlement. */
  orderSettleMs?: number
  paymentOutcome?: 'confirmed' | 'declined'
  /** Delays the POST /orders response *after* the order is persisted (simulates a timeout). */
  orderResponseDelayMs?: number
  /** Catalog mutation applied right before the first order attempt is validated. */
  checkoutMutation?: 'price_change' | 'sold_out'
  walletRejects?: boolean
  realtimeOffline?: boolean
}

const DEFAULT_LATENCY: LatencyProfile = { kind: 'range', minMs: 80, maxMs: 220 }

export const SCENARIOS: ScenarioDefinition[] = [
  { id: 'default', label: 'Padrão', description: 'Sucesso com latência realista.', latency: DEFAULT_LATENCY },
  { id: 'fast', label: 'Sem latência', description: 'Respostas imediatas (testes determinísticos).', latency: { kind: 'range', minMs: 0, maxMs: 0 } },
  { id: 'empty-catalog', label: 'Catálogo vazio', description: 'A listagem não retorna NFTs.', latency: DEFAULT_LATENCY, emptyCatalog: true },
  { id: 'slow-network', label: 'Rede lenta', description: 'Latência variável de 1,5 s a 3,5 s.', latency: { kind: 'range', minMs: 1500, maxMs: 3500 } },
  { id: 'out-of-order', label: 'Respostas fora de ordem', description: 'Requisições alternam entre lentas e rápidas.', latency: { kind: 'alternating', slowMs: 1800, fastMs: 150 } },
  { id: 'offline', label: 'Sem conexão', description: 'Toda requisição falha por erro de rede.', latency: DEFAULT_LATENCY, offline: true },
  {
    id: 'server-error',
    label: 'Erro 500 transitório',
    description: 'Catálogo e detalhe falham 3 vezes com 500 e depois se recuperam.',
    latency: DEFAULT_LATENCY,
    failures: [{ method: 'GET', path: '^/api/nfts', status: 500, code: 'INTERNAL', message: 'Falha interna simulada.', times: 3 }],
  },
  {
    id: 'service-unavailable',
    label: 'Serviço indisponível (503)',
    description: 'Catálogo responde 503 até o cenário mudar.',
    latency: DEFAULT_LATENCY,
    failures: [{ method: 'GET', path: '^/api/nfts', status: 503, code: 'TRANSIENT', message: 'Serviço temporariamente indisponível.' }],
  },
  {
    id: 'cart-mutation-error',
    label: 'Falha em mutations',
    description: 'Favoritos e carrinho falham uma vez com 500 (testa rollback otimista).',
    latency: DEFAULT_LATENCY,
    failures: [
      { method: 'PUT', path: '^/api/favorites/', status: 500, code: 'INTERNAL', message: 'Não foi possível salvar o favorito.', times: 1 },
      { method: 'DELETE', path: '^/api/favorites/', status: 500, code: 'INTERNAL', message: 'Não foi possível remover o favorito.', times: 1 },
      { method: 'PATCH', path: '^/api/cart/items/', status: 500, code: 'INTERNAL', message: 'Não foi possível atualizar o item.', times: 1 },
    ],
  },
  { id: 'short-session', label: 'Sessão curta', description: 'Sessões expiram após 30 s sem atividade.', latency: DEFAULT_LATENCY, sessionTtlMs: 30_000 },
  { id: 'price-change-at-checkout', label: 'Preço muda no checkout', description: 'O preço do primeiro item sobe 10% no envio do pedido.', latency: DEFAULT_LATENCY, checkoutMutation: 'price_change' },
  { id: 'sold-out-at-checkout', label: 'Edição esgota no checkout', description: 'A edição do primeiro item esgota no envio do pedido.', latency: DEFAULT_LATENCY, checkoutMutation: 'sold_out' },
  { id: 'order-timeout', label: 'Timeout ao criar pedido', description: 'O pedido é criado, mas a resposta excede o timeout do cliente.', latency: DEFAULT_LATENCY, orderResponseDelayMs: 12_000 },
  { id: 'payment-declined', label: 'Pagamento recusado', description: 'A liquidação do pedido é recusada.', latency: DEFAULT_LATENCY, paymentOutcome: 'declined' },
  { id: 'wallet-rejected', label: 'Carteira recusa conexão', description: 'A conexão com a carteira é recusada.', latency: DEFAULT_LATENCY, walletRejects: true },
  { id: 'realtime-offline', label: 'Tempo real fora do ar', description: 'O Socket.IO recusa conexões (REST continua).', latency: DEFAULT_LATENCY, realtimeOffline: true },
]

export const DEFAULT_SCENARIO_ID = 'default'
export const DEFAULT_SESSION_TTL_MS = 30 * 60_000
export const DEFAULT_ORDER_SETTLE_MS = 3_000

export function findScenario(id: string | null | undefined): ScenarioDefinition {
  return SCENARIOS.find((s) => s.id === id) ?? (SCENARIOS[0] as ScenarioDefinition)
}
