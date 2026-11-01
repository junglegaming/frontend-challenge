import { useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import {
  profileQueryOptions,
  useConnectWallet,
  useDisconnectWallet,
  walletsQueryOptions,
} from '@/features/account/api'
import { cartQueryOptions, quoteQueryOptions } from '@/features/cart/api'
import { readStoredCoupon, storeCoupon } from '@/features/cart/coupon-storage'
import { useCreateOrder } from '@/features/orders/api'
import { ApiError } from '@/shared/api/http-client'
import { queryKeys } from '@/shared/api/query-keys'
import {
  type Network,
  type Wallet,
  type WalletConnection,
  type WalletProvider,
  networkSchema,
} from '@/shared/contracts'
import { createIdempotencyKey } from '@/shared/lib/hash'
import { getOwnerKey } from '@/shared/session'

const IDEMPOTENCY_STORAGE_KEY = 'kurio:checkout-idempotency'

/** Chave estável por tentativa: sobrevive a refresh e timeout, evitando compra dupla. */
function readOrCreateIdempotencyKey(): string {
  const stored = sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY)
  if (stored) return stored
  return renewIdempotencyKey()
}

function renewIdempotencyKey(): string {
  const created = createIdempotencyKey()
  sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, created)
  return created
}

function toNetwork(value: string | undefined): Network {
  const parsed = networkSchema.safeParse(value)
  return parsed.success ? parsed.data : 'Ethereum'
}

export type WalletConnectionStatus = 'idle' | 'connecting' | 'connected' | 'rejected'

const ORDER_ERROR_MESSAGES: Partial<Record<string, string>> = {
  TIMEOUT:
    'Não recebemos a confirmação a tempo. Tente novamente: a mesma tentativa não gera outra compra.',
  NETWORK_ERROR: 'Falha de conexão. Tente novamente: a mesma tentativa não gera outra compra.',
}

/**
 * Estado e ações do checkout, compartilhados pelos layouts desktop e mobile.
 *
 * - Itens e totais vêm do carrinho e da cotação da API (referência do pedido).
 * - O total revisado só muda com aceite explícito: alterações de preço,
 *   estoque ou taxa exigem nova confirmação antes de enviar.
 * - Só carteiras cadastradas, conectadas pela simulação de carteira.
 * - Envio idempotente: cliques repetidos e reenvios após timeout recuperam o
 *   mesmo pedido.
 *
 * @returns Dados, estados derivados e ações do checkout.
 */
export function useCheckout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const cartQuery = useQuery(cartQueryOptions())
  const walletsQuery = useQuery(walletsQueryOptions())
  const profileQuery = useQuery(profileQueryOptions())
  const createOrder = useCreateOrder()
  const connectWallet = useConnectWallet()
  const disconnectWallet = useDisconnectWallet()

  const [idempotencyKey, setIdempotencyKey] = useState(readOrCreateIdempotencyKey)
  const [chosenWalletId, setChosenWalletId] = useState<string | null>(null)
  const [chosenNetwork, setChosenNetwork] = useState<Network | null>(null)
  const [provider, setProvider] = useState<WalletProvider>('coinbase')
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState(readStoredCoupon)
  const [acceptedTotal, setAcceptedTotal] = useState<string | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const items = cartQuery.data?.items ?? []
  const wallets: Wallet[] = walletsQuery.data ?? []
  const selectedWallet =
    wallets.find((w) => w.id === chosenWalletId) ??
    wallets.find((w) => w.isPrimary) ??
    wallets[0] ??
    null
  const network = chosenNetwork ?? toNetwork(selectedWallet?.network)

  const quote = useQuery(
    quoteQueryOptions({
      items: items.map(({ nftId, editionId, quantity }) => ({ nftId, editionId, quantity })),
      ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
    }),
  )
  const currentTotal = quote.data?.totalEth ?? null
  // O primeiro total exibido é o revisado; mudanças posteriores pedem aceite.
  if (acceptedTotal === null && currentTotal !== null) setAcceptedTotal(currentTotal)
  const isQuoteChanged =
    acceptedTotal !== null && currentTotal !== null && currentTotal !== acceptedTotal

  const quoteError = quote.error instanceof ApiError ? quote.error : null
  const couponError =
    quoteError && (quoteError.code === 'COUPON_INVALID' || quoteError.code === 'COUPON_EXPIRED')
      ? quoteError
      : null

  // A conexão vale para a combinação exata escolhida; mudar qualquer uma desconecta.
  const activeConnection =
    connection &&
    selectedWallet &&
    connection.walletId === selectedWallet.id &&
    connection.network === network &&
    connection.provider === provider
      ? connection
      : null
  const connectError = connectWallet.error instanceof ApiError ? connectWallet.error : null
  const connectionStatus: WalletConnectionStatus = connectWallet.isPending
    ? 'connecting'
    : activeConnection
      ? 'connected'
      : connectError?.code === 'WALLET_REJECTED'
        ? 'rejected'
        : 'idle'

  const blockers: string[] = []
  // Em erro, o TanStack Query mantém a cotação anterior: ela não pode valer para confirmar.
  if (quoteError) blockers.push(quoteError.message)
  else if (!quote.data) blockers.push('Calculando o total…')
  if (items.some((item) => item.quantity > item.available)) {
    blockers.push('Há itens sem estoque suficiente. Ajuste o carrinho para continuar.')
  }
  if (isQuoteChanged) blockers.push('Revise e aceite o novo total.')
  if (!selectedWallet) blockers.push('Cadastre uma carteira para pagar.')
  else if (!activeConnection) blockers.push('Conecte a carteira para confirmar.')

  const orderError = createOrder.error instanceof ApiError ? createOrder.error : null
  const orderErrorMessage = orderError
    ? (ORDER_ERROR_MESSAGES[orderError.code] ?? orderError.message)
    : null

  function resetConnectionAttempt() {
    connectWallet.reset()
  }

  function selectWallet(walletId: string) {
    setChosenWalletId(walletId)
    setChosenNetwork(null)
    resetConnectionAttempt()
  }

  function selectNetwork(value: Network) {
    setChosenNetwork(value)
    resetConnectionAttempt()
  }

  function selectProvider(value: WalletProvider) {
    setProvider(value)
    resetConnectionAttempt()
  }

  function connect() {
    if (!selectedWallet) return
    connectWallet.mutate(
      { walletId: selectedWallet.id, provider, network },
      { onSuccess: (created) => setConnection(created) },
    )
  }

  function disconnect() {
    if (connection) disconnectWallet.mutate(connection.connectionId)
    setConnection(null)
  }

  function applyCoupon(code: string) {
    const normalized = code.trim().toUpperCase()
    setAppliedCoupon(normalized)
    storeCoupon(normalized)
    // Mudança pedida pelo próprio usuário: o novo total já é o revisado.
    setAcceptedTotal(null)
  }

  function removeCoupon() {
    setAppliedCoupon(undefined)
    storeCoupon(undefined)
    setAcceptedTotal(null)
  }

  function acceptNewTotal() {
    if (currentTotal !== null) setAcceptedTotal(currentTotal)
  }

  function openReview() {
    if (blockers.length === 0) setIsReviewOpen(true)
  }

  function submitOrder() {
    if (!selectedWallet || !activeConnection || acceptedTotal === null || isQuoteChanged) return
    createOrder.mutate(
      {
        body: {
          items: items.map(({ nftId, editionId, quantity }) => ({ nftId, editionId, quantity })),
          ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
          walletId: selectedWallet.id,
          connectionId: activeConnection.connectionId,
          network,
          expectedTotalEth: acceptedTotal,
        },
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY)
          storeCoupon(undefined)
          setIsReviewOpen(false)
          void navigate({ to: '/pedido/$orderId', params: { orderId: order.id } })
        },
        onError: (error) => {
          setIsReviewOpen(false)
          if (!(error instanceof ApiError)) return
          if (error.code === 'STALE_QUOTE' || error.code === 'AVAILABILITY_CONFLICT') {
            void queryClient.invalidateQueries({ queryKey: queryKeys.quote.all })
            void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all(getOwnerKey()) })
          }
          if (error.code === 'WALLET_DISCONNECTED') setConnection(null)
          // A tentativa anterior já virou pedido com outros dados: esta é uma nova compra.
          if (error.code === 'IDEMPOTENCY_CONFLICT') setIdempotencyKey(renewIdempotencyKey())
        },
      },
    )
  }

  return {
    cartQuery,
    items,
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    walletsQuery,
    wallets,
    selectedWallet,
    network,
    provider,
    quote: quote.data,
    isQuoteLoading: quote.isLoading,
    couponError,
    appliedCoupon,
    acceptedTotal,
    isQuoteChanged,
    connectionStatus,
    activeConnection,
    connectErrorMessage: connectError?.message ?? null,
    blockers,
    canReview: blockers.length === 0,
    isReviewOpen,
    isSubmitting: createOrder.isPending,
    orderErrorMessage,
    selectWallet,
    selectNetwork,
    selectProvider,
    connect,
    disconnect,
    applyCoupon,
    removeCoupon,
    acceptNewTotal,
    openReview,
    closeReview: () => setIsReviewOpen(false),
    submitOrder,
  }
}

export type CheckoutState = ReturnType<typeof useCheckout>
