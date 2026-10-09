import { z } from 'zod';
import { emptyToUndefined } from '@/features/catalog/search-params';
export const loginSearchSchema = z.object({
  redirect: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});
export type LoginSearchParams = z.infer<typeof loginSearchSchema>;
export const parseLoginSearch = (raw: Record<string, unknown>) =>
  loginSearchSchema.parse(raw);

export const authSearchSchema = loginSearchSchema.extend({
  auth: z.enum(['login', 'signup']).optional().catch(undefined),
});
export const parseAuthSearch = (raw: Record<string, unknown>) =>
  authSearchSchema.parse(raw);
