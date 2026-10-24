/** The API accepts `Idempotency-Key` values of 1 to 128 characters. */
const MAX_KEY_LENGTH = 128

/**
 * Idempotency keys of the coins writes made for one checkout order, derived from the order's own key so the
 * debit and its refund belong to that order: replaying the same order never debits or refunds twice
 * (specs/011-web-coins-real-api/data-model.md, "Chave de operação").
 */
export function coinsKeys(orderKey: string): { debit: string; refund: string } {
  const keys = { debit: `${orderKey}:coins-debit`, refund: `${orderKey}:coins-refund` }
  if (keys.debit.length > MAX_KEY_LENGTH || keys.refund.length > MAX_KEY_LENGTH) {
    throw new Error(`Order key too long for a coins idempotency key (max ${MAX_KEY_LENGTH} characters).`)
  }
  return keys
}
