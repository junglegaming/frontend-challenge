/** Deterministic PRNG (mulberry32) so fixtures and simulated latency are reproducible. */
export function createRandom(seed: number) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
  }
}

/** Short FNV-1a hash, used for quote signatures and payload fingerprints (not security-sensitive). */
export function fingerprint(value: unknown): string {
  const input = JSON.stringify(value)
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`
}

export function randomHex(bytes: number) {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('')
}
