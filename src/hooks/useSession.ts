import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { guestCartStore, tokenStore } from '@/lib/storage'
import type { LoginInput, RegisterInput, User } from '@/schemas/auth'
import { authService } from '@/services/auth'
import { cartService } from '@/services/cart'
import { queryKeys } from './query-keys'

export const sessionQueryOptions = queryOptions({
  queryKey: queryKeys.session,
  queryFn: async ({ signal }): Promise<User | null> => {
    if (!tokenStore.get()) return null
    try {
      return await authService.getSession(signal)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        tokenStore.set(null)
        return null
      }
      throw error
    }
  },
  staleTime: 5 * 60_000,
})

export function useSession() {
  const query = useQuery(sessionQueryOptions)
  const user = query.data ?? null
  return { user, isAuthenticated: Boolean(user), isLoading: query.isPending }
}

/** Grava a sessão, limpa caches privados do usuário anterior e leva o carrinho do visitante junto. */
function useStartSession() {
  const queryClient = useQueryClient()
  return async ({ user, token }: { user: User; token: string }) => {
    tokenStore.set(token)
    const guestCartId = guestCartStore.peek()
    if (guestCartId) {
      try {
        await cartService.merge(guestCartId)
        guestCartStore.clear()
      } catch {
        // ponytail: merge falhou, itens do visitante continuam no carrinho de visitante para nova tentativa no próximo login
      }
    }
    removePrivateQueries(queryClient)
    queryClient.setQueryData(queryKeys.session, user)
  }
}

export function useLogin() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: startSession,
  })
}

export function useRegister() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: startSession,
  })
}

const PUBLIC_QUERIES = new Set(['session', 'nfts', 'nft'])

/**
 * Remove dados privados do usuário anterior. A query de sessão NÃO é removida: ela tem
 * observers ativos (root, header) e removê-la os deixaria presos a uma query órfã —
 * a troca de usuário é feita com setQueryData sobre a mesma query.
 */
function removePrivateQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({ predicate: (query) => !PUBLIC_QUERIES.has(String(query.queryKey[0])) })
}

/** Encerra a sessão local mesmo se a API falhar. */
export function clearSession(queryClient: ReturnType<typeof useQueryClient>) {
  tokenStore.set(null)
  removePrivateQueries(queryClient)
  queryClient.setQueryData(queryKeys.session, null)
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout()
      } catch {
        // logout local acontece de qualquer forma
      }
    },
    onSettled: () => clearSession(queryClient),
  })
}
