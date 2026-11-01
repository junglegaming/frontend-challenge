import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { getJson, httpClient, postJson } from '@/shared/api/http-client'
import { queryKeys } from '@/shared/api/query-keys'
import {
  type LoginRequest,
  type RegisterRequest,
  type Session,
  sessionSchema,
} from '@/shared/contracts'
import { clearSession, getToken, setSession } from '@/shared/session'

/**
 * Sessão atual, recuperada da API quando há token. Sobrevive ao refresh porque
 * o token fica no localStorage e é revalidado no servidor.
 *
 * @returns Opções do TanStack Query para a sessão.
 */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.session.all,
    queryFn: () => getJson(sessionSchema, '/auth/session'),
    enabled: Boolean(getToken()),
    retry: false,
    staleTime: 60_000,
  })
}

/** Autentica e persiste o token da sessão. */
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => postJson(sessionSchema, '/auth/login', body),
    onSuccess: (session: Session) => {
      setSession(session)
      queryClient.setQueryData(queryKeys.session.all, session)
      queryClient.invalidateQueries()
    },
  })
}

/** Cria a conta e já inicia a sessão. */
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterRequest) => postJson(sessionSchema, '/auth/register', body),
    onSuccess: (session: Session) => {
      setSession(session)
      queryClient.setQueryData(queryKeys.session.all, session)
      queryClient.invalidateQueries()
    },
  })
}

/** Encerra a sessão e limpa todo o cache privado. */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => httpClient.post('/auth/logout'),
    onSettled: () => {
      clearSession()
      queryClient.clear()
    },
  })
}
