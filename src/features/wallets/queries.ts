import { queryOptions } from '@tanstack/react-query';
import { http } from '@/lib/http/client';
import { endpoints } from '@/lib/http/endpoints';
import { walletsListResponseSchema } from '@/lib/http/schemas';
import { keyFactory } from '@/lib/query/keys';
export const walletsOptions = (userId: string) =>
  queryOptions({
    queryKey: keyFactory.wallets(userId),
    queryFn: async ({ signal }) =>
      walletsListResponseSchema.parse(
        (await http.get(endpoints.wallets, { signal })).data
      ),
  });
export async function updateWallet(
  id: string,
  input: import('@/types/api').PatchWalletRequest
) {
  const { patchWalletRequestSchema, walletSchema } =
    await import('@/lib/http/schemas');
  return walletSchema.parse(
    (
      await http.patch(
        endpoints.wallet(id),
        patchWalletRequestSchema.parse(input)
      )
    ).data
  );
}
export async function createWallet(
  input: import('@/types/api').CreateWalletRequest
) {
  const { createWalletRequestSchema, walletSchema } =
    await import('@/lib/http/schemas');
  return walletSchema.parse(
    (await http.post(endpoints.wallets, createWalletRequestSchema.parse(input)))
      .data
  );
}
