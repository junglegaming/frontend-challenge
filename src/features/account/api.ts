import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { z } from 'zod'

import { getJson, httpClient, patchJson, postJson } from '@/shared/api/http-client'
import { queryKeys } from '@/shared/api/query-keys'
import {
  type ConnectWalletRequest,
  type CreateWalletRequest,
  type UpdateProfileRequest,
  type UpdateWalletRequest,
  profileSchema,
  walletConnectionSchema,
  walletSchema,
} from '@/shared/contracts'
import { getOwnerKey, getToken } from '@/shared/session'

const walletsSchema = z.array(walletSchema)

/** Perfil do colecionador autenticado. */
export function profileQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.profile.all(getOwnerKey()),
    queryFn: () => getJson(profileSchema, '/profile'),
    enabled: Boolean(getToken()),
  })
}

/** Carteiras do usuário autenticado. */
export function walletsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.wallets.all(getOwnerKey()),
    queryFn: () => getJson(walletsSchema, '/wallets'),
    enabled: Boolean(getToken()),
  })
}

function useInvalidatePrivate() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.all(getOwnerKey()) })
    queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all(getOwnerKey()) })
  }
}

/** Atualiza nome e/ou avatar do perfil. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => patchJson(profileSchema, '/profile', body),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.all(getOwnerKey()), profile)
    },
  })
}

/** Altera a senha do usuário. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      httpClient.post('/profile/password', body),
  })
}

/** Cadastra uma carteira. */
export function useCreateWallet() {
  const invalidate = useInvalidatePrivate()
  return useMutation({
    mutationFn: (body: CreateWalletRequest) => postJson(walletSchema, '/wallets', body),
    onSuccess: () => invalidate(),
  })
}

/** Atualiza uma carteira (inclusive marcar como principal). */
export function useUpdateWallet() {
  const invalidate = useInvalidatePrivate()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateWalletRequest & { id: string }) =>
      patchJson(walletSchema, `/wallets/${id}`, body),
    onSuccess: () => invalidate(),
  })
}

/**
 * Conecta uma carteira cadastrada (simulação de extensão). Pode ser recusada
 * pela "carteira" (`WALLET_REJECTED`).
 *
 * @returns Mutation que resolve com a conexão ativa.
 */
export function useConnectWallet() {
  return useMutation({
    mutationFn: ({ walletId, ...body }: ConnectWalletRequest & { walletId: string }) =>
      postJson(walletConnectionSchema, `/wallets/${walletId}/connect`, body),
  })
}

/** Encerra a conexão simulada de uma carteira. */
export function useDisconnectWallet() {
  return useMutation({
    mutationFn: (connectionId: string) => httpClient.delete(`/wallets/connections/${connectionId}`),
  })
}
