import { createRandom } from './random'

export const SCENARIOS = {
  default: 'Padrão (latência 150–400 ms)',
  empty: 'Catálogo vazio',
  slow: 'Rede lenta (1,5–3 s)',
  'out-of-order': 'Buscas respondem fora de ordem',
  offline: 'Sem conexão',
  'server-error': 'Catálogo com 503 nas 3 primeiras tentativas',
  'session-expired': 'Sessão expira 20 s após o login',
  'favorite-fail': 'Favoritos falham (500)',
  'price-change': 'Preço do 1º item do carrinho sobe após 3 s',
  'sold-out': 'Edição do 1º item do carrinho esgota após 3 s',
  'order-timeout': 'Criação do pedido responde após o timeout',
  'payment-rejected': 'Pagamento recusado',
  'wallet-rejected': 'Carteira recusa a conexão',
} as const

export type ScenarioId = keyof typeof SCENARIOS

const STORAGE_KEY = 'kurio:scenario'

function isScenario(value: string | null): value is ScenarioId {
  return value !== null && value in SCENARIOS
}

/** `?scenario=<id>` tem prioridade e fica persistido para sobreviver a refresh. */
export function initScenario(): ScenarioId {
  const fromUrl = new URLSearchParams(window.location.search).get('scenario')
  if (isScenario(fromUrl)) setScenario(fromUrl)
  return getScenario()
}

export function getScenario(): ScenarioId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isScenario(stored) ? stored : 'default'
  } catch {
    return 'default'
  }
}

export function setScenario(id: ScenarioId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // sem storage: cenário volta ao padrão no próximo carregamento
  }
}

const random = createRandom(7)

export function latencyMs(): number {
  return getScenario() === 'slow' ? random.int(1500, 3000) : random.int(150, 400)
}

let catalogRequests = 0
/** out-of-order: requisições ímpares demoram, pares voltam rápido — a resposta antiga chega depois da nova. */
export function catalogLatencyMs(): number {
  catalogRequests += 1
  if (getScenario() === 'out-of-order') return catalogRequests % 2 === 1 ? 1800 : 200
  return latencyMs()
}

let catalogFailures = 0
export function shouldFailCatalog(): boolean {
  if (getScenario() !== 'server-error' || catalogFailures >= 3) return false
  catalogFailures += 1
  return true
}
