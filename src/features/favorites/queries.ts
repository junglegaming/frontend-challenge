import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/http/client';
import { endpoints } from '@/lib/http/endpoints';
import { favoritesResponseSchema } from '@/lib/http/schemas';
import type { FavoritesResponse } from '@/types/api';
import { keyFactory } from '@/lib/query/keys';
import { getPersistedSession } from '@/lib/session/storage';
export function useFavorites(userId?: string) {
  const token = getPersistedSession()?.token;
  const isCurrentUser = (ownerToken = token) =>
    !!userId &&
    getPersistedSession()?.user.id === userId &&
    getPersistedSession()?.token === ownerToken;
  const client = useQueryClient();
  const queryKey = keyFactory.favorites.all(userId);
  const favorites = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async ({ signal }) =>
      favoritesResponseSchema.parse(
        (await http.get<unknown>(endpoints.favorites, { signal })).data
      ),
  });
  const pending = useIsMutating({ mutationKey: queryKey });
  const mutation = useMutation({
    mutationKey: queryKey,
    mutationFn: async ({
      id,
      selected,
      token: ownerToken,
    }: {
      id: string;
      selected: boolean;
      token: string;
    }) => {
      if (!isCurrentUser(ownerToken)) throw new Error('Sessão alterada');
      const response = selected
        ? await http.delete<unknown>(endpoints.favorite(id))
        : await http.put<unknown>(endpoints.favorite(id));
      return favoritesResponseSchema.parse(response.data);
    },
    onMutate: async ({ id, selected, token: ownerToken }) => {
      await client.cancelQueries({ queryKey });
      if (!isCurrentUser(ownerToken))
        return { snapshot: undefined, queryKey, token: ownerToken };
      const snapshot = client.getQueryData<FavoritesResponse>(queryKey);
      const ids = selected
        ? (snapshot?.ids ?? []).filter((value) => value !== id)
        : [...new Set([...(snapshot?.ids ?? []), id])];
      client.setQueryData(queryKey, { ids, count: ids.length });
      return { snapshot, queryKey, token: ownerToken };
    },
    onError: (_error, _variables, context) => {
      if (!isCurrentUser(context?.token)) return;
      client.setQueryData(
        context?.queryKey ?? queryKey,
        context?.snapshot ?? { ids: [], count: 0 }
      );
      toast.error('Não foi possível atualizar o favorito. Tente novamente.');
    },
    onSuccess: (_data, { selected, token: ownerToken }) => {
      if (!isCurrentUser(ownerToken)) return;
      toast.success(
        selected ? 'NFT removido dos favoritos' : 'NFT adicionado aos favoritos'
      );
    },
    onSettled: (_data, _error, variables, context) => {
      if (isCurrentUser(variables.token))
        return Promise.all([
          client.invalidateQueries({ queryKey: context?.queryKey ?? queryKey }),
          client.invalidateQueries({
            queryKey: keyFactory.nfts.lists,
            predicate: (query) =>
              keyFactory.belongsToUser(query.queryKey, userId!) &&
              !!(query.queryKey[2] as { favoritesOnly?: boolean })
                .favoritesOnly,
          }),
        ]);
    },
  });
  return {
    favorites,
    mutation: { ...mutation, isPending: mutation.isPending || pending > 0 },
  };
}
