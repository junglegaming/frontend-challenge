import { z } from 'zod';
import { collectorDraftSchema } from './collector-draft';

export const checkoutDraftSchema = z.object({
  userId: z.string().min(1),
  walletId: z.string().optional(),
  network: z.string().optional(),
  coupon: z.string().optional(),
  collector: collectorDraftSchema.optional(),
});
export type CheckoutDraft = z.infer<typeof checkoutDraftSchema>;
const storageKey = 'gm_checkout_draft';

export function saveCheckoutDraft(draft: CheckoutDraft): void {
  localStorage.setItem(
    storageKey,
    JSON.stringify(checkoutDraftSchema.parse(draft))
  );
}

export function clearCheckoutDraft(): void {
  localStorage.removeItem(storageKey);
}

export function restoreCheckoutDraft(userId: string): CheckoutDraft | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = checkoutDraftSchema.safeParse(JSON.parse(raw));
    if (parsed.success && parsed.data.userId === userId) return parsed.data;
  } catch {
    /* Invalid persisted data is discarded. */
  }
  clearCheckoutDraft();
  return null;
}
