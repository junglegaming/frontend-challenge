const STORAGE_KEY = 'nft-cart:guest-id'

/** Stable id for the visitor's cart, sent as `X-Guest-Cart` so it survives refresh and merges on login. */
export function getOrCreateGuestCartId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

export function peekGuestCartId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearGuestCartId() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
