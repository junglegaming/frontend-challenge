/**
 * One idempotency key per quote signature: a retry against the same quote reuses its key so the
 * backend can recognize and safely replay it (no duplicate order); a new quote (cart changed)
 * gets a fresh key. Kept in memory only — scoped to this tab's checkout attempt.
 */
const keysBySignature = new Map<string, string>()

export function idempotencyKeyFor(quoteSignature: string): string {
  const existing = keysBySignature.get(quoteSignature)
  if (existing) return existing
  const key = crypto.randomUUID()
  keysBySignature.set(quoteSignature, key)
  return key
}

/**
 * Gives a quote a fresh key. Called after a paid-with-coins order was definitely rejected and its coins were given
 * back: the old key's debit is already "spent", so reusing it would replay that debit without charging and let the
 * next attempt create the order for free (specs/011-web-coins-real-api/data-model.md, "Por que rotacionar").
 */
export function rotateIdempotencyKey(quoteSignature: string): string {
  const key = crypto.randomUUID()
  keysBySignature.set(quoteSignature, key)
  return key
}
