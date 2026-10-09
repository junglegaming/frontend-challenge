import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/session/state';
import { getAnonymousId, getPersistedSession } from '@/lib/session/storage';
import { keyFactory } from '@/lib/query/keys';
import {
  cartOptions,
  changeCart,
  errorCode,
  newestCart,
  quoteOptions,
  validateCoupon,
} from '../queries';

export function useCart() {
  const { session, isHydrating } = useSession();
  const userId = session?.user.id;
  const token = session?.token;
  const anonymousId = token ? undefined : getAnonymousId();
  const client = useQueryClient();
  const [coupon, setCoupon] = useState<string>();
  const [couponError, setCouponError] = useState('');
  const [feedback, setFeedback] = useState('');
  const busy = useRef(false);
  const couponBusy = useRef(false);
  const sameSession = () =>
    getPersistedSession()?.token === token &&
    (token !== undefined || getAnonymousId() === anonymousId);
  const cart = useQuery({ ...cartOptions(userId), enabled: !isHydrating });
  const quoteConfig = quoteOptions(userId, coupon);
  const quote = useQuery({
    ...quoteConfig,
    queryFn: async (context) => {
      try {
        return await quoteConfig.queryFn!(context);
      } catch (error) {
        const code = errorCode(error);
        if (
          sameSession() &&
          coupon &&
          (code === 'COUPON_EXPIRED' || code === 'COUPON_INVALID')
        ) {
          setCoupon(undefined);
          setCouponError(
            code === 'COUPON_EXPIRED'
              ? 'Cupom expirado. O cupom foi removido.'
              : 'Cupom inválido. O cupom foi removido.'
          );
        }
        throw error;
      }
    },
    enabled: !!cart.data?.items.length && !cart.isError && !isHydrating,
  });
  const invalidateQuote = () =>
    client.invalidateQueries({
      queryKey: keyFactory.quote(userId).slice(0, 2),
    });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof changeCart>[0]) => {
      if (!sameSession()) throw new Error('Sessão alterada');
      return changeCart(input);
    },
    onMutate: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: keyFactory.cart(userId) }),
        client.cancelQueries({
          queryKey: keyFactory.quote(userId).slice(0, 2),
        }),
      ]);
    },
    onSuccess: (value) => {
      if (sameSession())
        client.setQueryData(keyFactory.cart(userId), newestCart(value, userId));
    },
    onError: (error) => {
      if (!sameSession()) return;
      setFeedback(
        errorCode(error) === 'INSUFFICIENT_STOCK'
          ? 'Quantidade indisponível. Mantivemos a quantidade anterior; confira o limite disponível.'
          : 'Não foi possível alterar o carrinho. Tente novamente.'
      );
    },
    onSettled: async () => {
      if (sameSession())
        await Promise.all([
          client.invalidateQueries({ queryKey: keyFactory.cart(userId) }),
          invalidateQuote(),
        ]);
      busy.current = false;
    },
  });
  const couponMutation = useMutation({
    mutationFn: (code: string) => {
      if (!sameSession()) throw new Error('Sessão alterada');
      return validateCoupon(code);
    },
    onSuccess: async (value) => {
      if (!sameSession()) return;
      setCoupon(value.code);
      setCouponError('');
      await invalidateQuote();
    },
    onError: (error) => {
      if (!sameSession()) return;
      setCoupon(undefined);
      setCouponError(
        errorCode(error) === 'COUPON_EXPIRED'
          ? 'Cupom expirado. O cupom foi removido.'
          : errorCode(error) === 'COUPON_INVALID'
            ? 'Cupom inválido.'
            : 'Não foi possível validar o cupom. Tente novamente.'
      );
      void invalidateQuote();
    },
    onSettled: () => {
      couponBusy.current = false;
    },
  });
  function change(nftId: string, qty?: number) {
    if (busy.current || isHydrating || couponBusy.current) return;
    busy.current = true;
    setFeedback('');
    mutation.mutate({ nftId, qty });
  }
  return {
    cart,
    quote,
    feedback,
    coupon,
    couponError,
    pending: mutation.isPending,
    couponPending: couponMutation.isPending,
    change,
    applyCoupon: (code: string) => {
      if (!couponBusy.current && !busy.current) {
        couponBusy.current = true;
        couponMutation.mutate(code.trim().toUpperCase());
      }
    },
    removeCoupon: () => {
      setCoupon(undefined);
      setCouponError('');
      void invalidateQuote();
    },
  };
}
export type CartController = ReturnType<typeof useCart>;
