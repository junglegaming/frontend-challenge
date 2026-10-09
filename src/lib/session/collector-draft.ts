import { z } from 'zod';
// Draft accepts unfinished/invalid text so expiry never discards edits.
export const collectorDraftSchema = z.object({
  name: z.string(),
  username: z.string(),
  profileName: z.string(),
  email: z.string(),
  referralCode: z.string(),
  address: z.string(),
  network: z.enum(['ethereum', 'sepolia']),
  provider: z.enum(['metamask', 'walletconnect', 'coinbase']),
  secondaryIdentity: z.string(),
  ensName: z.string(),
  note: z.string(),
});
