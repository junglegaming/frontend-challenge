/** Port: where the simulated backend keeps its state between page loads. */
export interface StatePersistence<TState> {
  load(): TState | null
  save(state: TState): void
  clear(): void
}

/** Adapter: localStorage persistence with schema versioning (unknown versions are discarded). */
export class LocalStoragePersistence<TState> implements StatePersistence<TState> {
  private readonly key: string
  private readonly schemaVersion: number

  constructor(key: string, schemaVersion: number) {
    this.key = key
    this.schemaVersion = schemaVersion
  }

  load(): TState | null {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'schemaVersion' in parsed &&
        parsed.schemaVersion === this.schemaVersion &&
        'state' in parsed
      ) {
        return parsed.state as TState
      }
      return null
    } catch {
      return null
    }
  }

  save(state: TState) {
    try {
      localStorage.setItem(this.key, JSON.stringify({ schemaVersion: this.schemaVersion, state }))
    } catch {
      // Storage full/blocked: the simulation keeps working in memory.
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.key)
    } catch {
      // ignore
    }
  }
}

/**
 * Single source of truth for every bounded context, so catalog, cart, favorites, orders, profile
 * and wallets stay consistent. Mutations are synchronous and persisted atomically.
 */
export class Store<TState> {
  private state: TState

  private readonly persistence: StatePersistence<TState>
  private readonly createInitialState: () => TState

  constructor(persistence: StatePersistence<TState>, createInitialState: () => TState) {
    this.persistence = persistence
    this.createInitialState = createInitialState
    this.state = persistence.load() ?? createInitialState()
  }

  read<T>(selector: (state: TState) => T): T {
    return selector(this.state)
  }

  /** Runs a mutation and persists the result. Throwing inside `mutate` discards nothing already written — keep mutations validated first. */
  write<T>(mutate: (state: TState) => T): T {
    const result = mutate(this.state)
    this.persistence.save(this.state)
    return result
  }

  reset() {
    this.persistence.clear()
    this.state = this.createInitialState()
    this.persistence.save(this.state)
  }
}

/** Port: time source. `Date.now` is used so Playwright's `page.clock` controls the simulation. */
export interface Clock {
  now(): number
}

export const systemClock: Clock = { now: () => Date.now() }
