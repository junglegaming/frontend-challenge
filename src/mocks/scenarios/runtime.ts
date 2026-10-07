import { createRandom } from '../infra/random'
import { DEFAULT_SCENARIO_ID, findScenario, type ScenarioDefinition } from './definitions'

const STORAGE_KEY = 'nft-mock:scenario'
const SEED = 1337

type Listener = (scenario: ScenarioDefinition) => void

/**
 * Active scenario + its deterministic runtime state (failure counters, latency RNG, one-shot triggers).
 * Selecting a scenario always restarts that state, so runs are reproducible.
 */
class ScenarioRuntime {
  private scenario: ScenarioDefinition
  private random = createRandom(SEED)
  private requestCount = 0
  private failureCounters = new Map<number, number>()
  private consumedTriggers = new Set<string>()
  private listeners = new Set<Listener>()

  constructor() {
    this.scenario = findScenario(this.readPersisted())
  }

  get current() {
    return this.scenario
  }

  select(id: string) {
    this.scenario = findScenario(id)
    try {
      localStorage.setItem(STORAGE_KEY, this.scenario.id)
    } catch {
      // ignore
    }
    this.restart()
    this.listeners.forEach((listener) => listener(this.scenario))
  }

  restart() {
    this.random = createRandom(SEED)
    this.requestCount = 0
    this.failureCounters.clear()
    this.consumedTriggers.clear()
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  nextLatencyMs(): number {
    const latency = this.scenario.latency
    this.requestCount += 1
    if (latency.kind === 'alternating') return this.requestCount % 2 === 1 ? latency.slowMs : latency.fastMs
    if (latency.maxMs === 0) return 0
    return Math.round(latency.minMs + this.random.next() * (latency.maxMs - latency.minMs))
  }

  /** Returns the failure rule to apply to this request, honouring `times`. */
  matchFailure(method: string, pathname: string) {
    const rules = this.scenario.failures ?? []
    for (const [index, rule] of rules.entries()) {
      if (rule.method !== '*' && rule.method !== method) continue
      if (!new RegExp(rule.path).test(pathname)) continue
      const used = this.failureCounters.get(index) ?? 0
      if (rule.times !== undefined && used >= rule.times) continue
      this.failureCounters.set(index, used + 1)
      return rule
    }
    return null
  }

  /** One-shot triggers (e.g. checkout mutation) fire once per scenario selection. */
  consumeTrigger(name: string) {
    if (this.consumedTriggers.has(name)) return false
    this.consumedTriggers.add(name)
    return true
  }

  private readPersisted() {
    try {
      const fromUrl = new URLSearchParams(location.search).get('scenario')
      if (fromUrl) {
        localStorage.setItem(STORAGE_KEY, fromUrl)
        return fromUrl
      }
      return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SCENARIO_ID
    } catch {
      return DEFAULT_SCENARIO_ID
    }
  }
}

export const scenarioRuntime = new ScenarioRuntime()
