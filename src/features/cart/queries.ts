import { queryOptions } from '@tanstack/react-query';
import { http } from '@/lib/http/client';
import { endpoints } from '@/lib/http/endpoints';
import {
  cartSchema,
  quoteSchema,
  couponValidateResponseSchema,
} from '@/lib/http/schemas';
import { keyFactory } from '@/lib/query/keys';
import { queryClient } from '@/lib/query/client';
import type { Cart, AppError, Quote } from '@/types/api';

export const errorCode = (error: unknown) => {
  const failure = error as AppError | undefined;
  if (failure?.kind === 'validation') return 'VALIDATION_ERROR';
  return failure?.kind === 'http' ? failure.code : undefined;
};
export function newestCart(incoming: Cart, userId?: string) {
  const current = queryClient.getQueryData<Cart>(keyFactory.cart(userId));
  return current && current.version >= incoming.version ? current : incoming;
}
export const cartOptions = (userId?: string) =>
  queryOptions({
    queryKey: keyFactory.cart(userId),
    queryFn: async ({ signal }) =>
      newestCart(
        cartSchema.parse((await http.get(endpoints.cart, { signal })).data),
        userId
      ),
  });
export const quoteOptions = (userId?: string, coupon?: string) =>
  queryOptions({
    queryKey: keyFactory.quote(userId, coupon),
    queryFn: async ({ signal }) => {
      const incoming = quoteSchema.parse(
        (await http.post(endpoints.cartQuote, { coupon }, { signal })).data
      );
      const current = queryClient.getQueryData<Quote>(
        keyFactory.quote(userId, coupon)
      );
      return current && current.quoteVersion > incoming.quoteVersion
        ? current
        : incoming;
    },
    retry: (attempt, error) => !errorCode(error) && attempt < 2,
  });
export async function validateCoupon(code: string) {
  return couponValidateResponseSchema.parse(
    (await http.post(endpoints.couponsValidate, { code })).data
  ).coupon;
}
export async function changeCart({
  nftId,
  qty,
}: {
  nftId: string;
  qty?: number;
}) {
  try {
    return cartSchema.parse(
      (qty === undefined
        ? await http.delete(endpoints.cartItem(nftId))
        : await http.patch(endpoints.cartItem(nftId), { qty })
      ).data
    );
  } catch (error) {
    if (qty === undefined && errorCode(error) === 'NOT_FOUND')
      return cartSchema.parse((await http.get(endpoints.cart)).data);
    throw error;
  }
}
