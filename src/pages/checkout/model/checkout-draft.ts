import { z } from 'zod'
import { NETWORKS } from '@/domains/wallets'

/**
 * What the collector already typed, kept per user in sessionStorage so an expired session or a
 * refresh does not lose it (research.md R6). The wallet connection is never stored.
 */
const STORAGE_KEY = 'checkout:draft'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

const draftSchema = z.object({
  userId: z.string().min(1),
  collector: z.object({ fullName: z.string(), email: z.string(), note: z.string().optional() }),
  network: z.enum(NETWORKS).nullable(),
  walletId: z.string().nullable(),
  /**
   * Idempotency key of the current attempt. `unanswered` is the exact request already sent without
   * an answer (timeout, refresh): it must be replayed as-is so the backend returns the same order.
   */
  attempt: z
    .object({
      signature: z.string(),
      key: z.string(),
      unanswered: z
        .object({
          quoteSignature: z.string(),
          network: z.enum(NETWORKS),
          walletId: z.string(),
          collector: z.object({ fullName: z.string(), email: z.string(), country: z.string(), note: z.string().optional() }),
        })
        .nullable(),
    })
    .nullable(),
  pendingOrderId: z.string().nullable(),
  savedAt: z.iso.datetime(),
})
export type CheckoutDraft = z.infer<typeof draftSchema>

export function readDraft(userId: string): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = draftSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return null
    const draft = parsed.data
    if (draft.userId !== userId || Date.now() - Date.parse(draft.savedAt) > MAX_AGE_MS) {
      clearDraft()
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function writeDraft(draft: Omit<CheckoutDraft, 'savedAt'>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }))
  } catch {
    // Storage blocked: checkout still works, it just can't be resumed.
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}
