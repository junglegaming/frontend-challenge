import type { MockDb } from './store'

export const DB_STORAGE_KEY = 'gm_db_v1'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const memoryStore = new Map<string, string>()

const memoryStorage: StorageLike = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value)
  },
  removeItem: (key) => {
    memoryStore.delete(key)
  },
}

let resolved: StorageLike | undefined

export const safeStorage = (): StorageLike => {
  if (resolved) return resolved
  try {
    const probe = '__gm_probe__'
    globalThis.localStorage.setItem(probe, '1')
    globalThis.localStorage.removeItem(probe)
    resolved = globalThis.localStorage
  } catch {
    resolved = memoryStorage
  }
  return resolved
}

const ARRAY_KEYS = ['sessions', 'wallets', 'orders'] as const

const RECORD_KEYS = [
  'carts',
  'favorites',
  'idempotency',
  'quoteVersions',
  'seq',
  'flags',
] as const

const isDbShape = (value: unknown): value is MockDb => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const db = value as Record<string, unknown>
  if (!Array.isArray(db.nfts) || !Array.isArray(db.users)) return false
  if (!ARRAY_KEYS.every((key) => db[key] === undefined || Array.isArray(db[key]))) return false
  return RECORD_KEYS.every((key) => {
    const entry = db[key]
    return (
      entry === undefined ||
      (typeof entry === 'object' && entry !== null && !Array.isArray(entry))
    )
  })
}

export const loadDb = (): MockDb | undefined => {
  try {
    const raw = safeStorage().getItem(DB_STORAGE_KEY)
    if (!raw) return undefined
    const parsed: unknown = JSON.parse(raw)
    return isDbShape(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

export const saveDb = (db: MockDb): void => {
  try {
    safeStorage().setItem(DB_STORAGE_KEY, JSON.stringify(db))
  } catch {
    return
  }
}

export const clearStorage = (): void => {
  try {
    safeStorage().removeItem(DB_STORAGE_KEY)
  } catch {
    return
  }
}
