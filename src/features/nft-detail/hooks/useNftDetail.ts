import { useEffect, useRef, useState } from 'react';
import { getRouteApi, useRouter } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from '@/lib/session/state';
import { getPersistedSession } from '@/lib/session/storage';
import { useFavorites } from '@/features/favorites/queries';
import { openAuth } from '@/features/auth/navigation';
import { http } from '@/lib/http/client';
import { endpoints } from '@/lib/http/endpoints';
import { cartSchema } from '@/lib/http/schemas';
import { keyFactory } from '@/lib/query/keys';
import type { AppError, Cart } from '@/types/api';
import { nftDetailOptions } from '../queries';

const route = getRouteApi('/nfts/$nftId');
export function useNftDetail() {
  const { nftId } = route.useParams();
  const { qty } = route.useSearch();
  const navigate = route.useNavigate();
  const router = useRouter();
  const client = useQueryClient();
  const { session, isHydrating } = useSession();
  const userId = session?.user.id;
  const query = useQuery(nftDetailOptions(nftId));
  const { favorites, mutation: favoriteMutation } = useFavorites(userId);
  const buying = useRef(false);
  const favoriting = useRef(false);
  const [feedback, setFeedback] = useState('');
  const [reserved, setReserved] = useState<{ token?: string; qty: number }>();
  const available = Math.max(
    0,
    (query.data?.available ?? 0) -
      (reserved?.token === session?.token ? (reserved?.qty ?? 0) : 0)
  );
  const quantity = Math.max(1, Math.min(qty, available));
  const onQuantity = (next: number) =>
    navigate({ search: (previous) => ({ ...previous, qty: next }) });
  useEffect(() => {
    if (query.data && qty !== quantity)
      void navigate({
        search: (previous) => ({ ...previous, qty: quantity }),
        replace: true,
      });
  }, [query.data, qty, quantity, navigate]);
  const cartMutation = useMutation({
    mutationFn: async ({ token }: { token?: string }) => {
      if (getPersistedSession()?.token !== token)
        throw new Error('Sessão alterada');
      return cartSchema.parse(
        (
          await http.post<unknown>(endpoints.cartItems, {
            nftId,
            qty: quantity,
          })
        ).data
      );
    },
    onSuccess: async (cart, { token }) => {
      if (getPersistedSession()?.token !== token) return;
      const key = keyFactory.cart(userId);
      const previous = client.getQueryData<Cart>(key);
      if (!previous || cart.version >= previous.version)
        client.setQueryData(key, cart);
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({
          queryKey: keyFactory.quote(userId).slice(0, 2),
        }),
      ]);
      if (getPersistedSession()?.token !== token) return;
      toast.success('NFT adicionado ao carrinho');
      if (router.state.location.pathname === `/nfts/${nftId}`)
        await router.navigate({ to: '/cart' });
    },
    onError: async (error, { token }) => {
      if (getPersistedSession()?.token !== token) return;
      const failure = error as unknown as AppError;
      if (failure.kind === 'http' && failure.code === 'INSUFFICIENT_STOCK') {
        setFeedback('Quantidade indisponível. Atualizando o limite de compra.');
        try {
          const [detail, response] = await Promise.all([
            query.refetch(),
            http.get<unknown>(endpoints.cart),
          ]);
          if (getPersistedSession()?.token !== token) return;
          const cart = cartSchema.parse(response.data);
          const alreadyInCart =
            cart.items.find((item) => item.nftId === nftId)?.qty ?? 0;
          const limit = Math.max(
            0,
            (detail.data?.available ?? 0) - alreadyInCart
          );
          setReserved({ token, qty: alreadyInCart });
          setFeedback(
            limit
              ? `Você pode adicionar até ${limit} exemplar(es). Ajustamos a quantidade ao limite disponível.`
              : 'Todos os exemplares disponíveis já estão no carrinho.'
          );
        } catch {
          setFeedback('Não foi possível atualizar o estoque. Tente novamente.');
        }
      } else
        setFeedback('Não foi possível adicionar ao carrinho. Tente novamente.');
      toast.error('Não foi possível adicionar ao carrinho.');
    },
    onSettled: () => {
      buying.current = false;
    },
  });
  function onFavorite() {
    if (favoriting.current || favoriteMutation.isPending || isHydrating) return;
    if (!session) {
      void openAuth(router);
      return;
    }
    if (!favorites.data || favorites.isError) return;
    favoriting.current = true;
    favoriteMutation.mutate(
      {
        id: nftId,
        selected: favorites.data.ids.includes(nftId),
        token: session.token,
      },
      {
        onSettled: () => {
          favoriting.current = false;
        },
      }
    );
  }
  function onBuy() {
    if (buying.current || isHydrating || !query.data?.editable || available < 1)
      return;
    buying.current = true;
    setFeedback('Adicionando NFT ao carrinho…');
    cartMutation.mutate({ token: session?.token });
  }
  return {
    query,
    userId,
    favorites,
    selected: favorites.data?.ids.includes(nftId) ?? false,
    favoritePending:
      isHydrating ||
      favoriteMutation.isPending ||
      (!!session && !favorites.data),
    onFavorite,
    quantity,
    available,
    onQuantity,
    onBuy,
    buying: cartMutation.isPending,
    feedback,
  };
}
export type NftDetailController = ReturnType<typeof useNftDetail>;
