import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/components/common/ErrorState'
import { useCreateQuote, usePlaceOrder } from '@/hooks/useCheckout'
import { checkoutDraftStore } from '@/lib/storage'
import { realtimeEvents } from '@/realtime/events'
import type { User } from '@/schemas/auth'
import type { Cart } from '@/schemas/cart'
import type { Profile } from '@/schemas/profile'
import { quoteSchema, type Quote } from '@/schemas/quote'
import type { Wallet } from '@/schemas/wallet'
import type { CheckoutFormValues } from './checkout-form-schema'

/**
 * Estados explícitos do pagamento:
 * - editing: formulário aberto, sem cotação.
 * - reviewing: cotação criada, aguardando confirmação.
 * - submitting: pedido em envio.
 * - uncertain: falha transitória ou tentativa sem desfecho (permite repetir com segurança).
 * - done: pedido criado, redirecionando para o recibo.
 */
type CheckoutStep = 'editing' | 'reviewing' | 'submitting' | 'uncertain' | 'done'

interface UseCheckoutFlowOptions {
  cart: Cart
  wallets: Wallet[]
  profile: Profile | null
  user: User
}

function draftText(draft: Record<string, unknown> | null, key: string) {
  const value = draft?.[key]
  return typeof value === 'string' ? value : undefined
}

function freshQuoteFrom(details: unknown): Quote | null {
  if (typeof details !== 'object' || details === null || !('quote' in details)) return null
  const parsed = quoteSchema.safeParse(details.quote)
  return parsed.success ? parsed.data : null
}

export function useCheckoutFlow({ cart, wallets, profile, user }: UseCheckoutFlowOptions) {
  const navigate = useNavigate()
  const createQuote = useCreateQuote()
  const placeOrder = usePlaceOrder()
  const resetPlaceOrder = placeOrder.reset

  const primaryWallet = wallets.find((wallet) => wallet.slot === 'primary') ?? wallets[0] ?? null
  const secondaryWallet = wallets.find((wallet) => wallet.slot === 'secondary') ?? null
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(primaryWallet?.id ?? null)
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? null

  const draftStore = useMemo(() => checkoutDraftStore(user.id), [user.id])
  const [initialValues] = useState<CheckoutFormValues>(() => {
    const draft = draftStore.get()
    return {
      displayName: draftText(draft, 'displayName') ?? profile?.displayName ?? user.displayName,
      username: draftText(draft, 'username') ?? profile?.username ?? user.username,
      profileName: draftText(draft, 'profileName') ?? primaryWallet?.profileName ?? profile?.walletNickname ?? '',
      email: draftText(draft, 'email') ?? profile?.email ?? user.email,
      note: draftText(draft, 'note') ?? '',
    }
  })

  const [quote, setQuote] = useState<Quote | null>(null)
  const [staleDiff, setStaleDiff] = useState<{ previous: Quote; next: Quote } | null>(null)
  const [reviewBuyer, setReviewBuyer] = useState<CheckoutFormValues | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const blockedItem = cart.items.find((item) => item.available === 0 || item.quantity > item.available)
  const cartNftIds = useMemo(() => new Set(cart.items.map((item) => item.nftId)), [cart.items])

  const handleValuesChange = useCallback(
    (values: Partial<CheckoutFormValues>) => {
      draftStore.set(values)
    },
    [draftStore],
  )

  const pendingOrderId = placeOrder.attempt?.orderId
  const unconfirmedAttempt = Boolean(placeOrder.attempt && !placeOrder.attempt.orderId)
  const unresolvedAttempt = unconfirmedAttempt && !placeOrder.isPending
  const placeError = placeOrder.error
  const uncertain =
    placeError instanceof ApiError && (placeError.isTimeout || placeError.isNetwork || placeError.status >= 500)

  const step: CheckoutStep = pendingOrderId
    ? 'done'
    : placeOrder.isPending
      ? 'submitting'
      : uncertain || unresolvedAttempt
        ? 'uncertain'
        : quote
          ? 'reviewing'
          : 'editing'

  useEffect(() => {
    if (!pendingOrderId) return
    draftStore.set(null)
    void navigate({ to: '/orders/$orderId', params: { orderId: pendingOrderId } })
  }, [pendingOrderId, draftStore, navigate])

  useEffect(() => {
    if (!quote) return
    return realtimeEvents.on('nft.updated', (event) => {
      if (!cartNftIds.has(event.resource.id)) return
      setQuote(null)
      setStaleDiff(null)
      setReviewBuyer(null)
      setNotice('Um NFT deste pedido foi atualizado. Revise o pedido novamente.')
      resetPlaceOrder()
    })
  }, [quote, cartNftIds, resetPlaceOrder])

  const selectWallet = (wallet: Wallet) => {
    setSelectedWalletId(wallet.id)
    if (quote && quote.walletId !== wallet.id) {
      setQuote(null)
      setStaleDiff(null)
      setReviewBuyer(null)
      setNotice('Carteira alterada. Revise o pedido antes de confirmar novamente.')
      resetPlaceOrder()
    }
  }

  const disconnectWallet = (wallet: Wallet) => {
    if (!quote || quote.walletId !== wallet.id) return
    setQuote(null)
    setStaleDiff(null)
    setReviewBuyer(null)
    setNotice('A carteira selecionada não está mais conectada. Conecte-a e revise o pedido novamente.')
    resetPlaceOrder()
  }

  const review = (values: CheckoutFormValues) => {
    if (unconfirmedAttempt) {
      setNotice('Conclua a tentativa de compra anterior com "Tentar novamente" antes de revisar outro pedido.')
      return
    }
    if (!selectedWallet) {
      setNotice('Selecione uma carteira para revisar o pedido.')
      return
    }
    if (!selectedWallet.connected) {
      setNotice('Conecte a carteira selecionada para revisar o pedido.')
      return
    }
    if (blockedItem) {
      setNotice('Há itens indisponíveis no carrinho. Ajuste as quantidades antes de revisar.')
      return
    }
    setReviewBuyer(values)
    setNotice(null)
    createQuote.mutate(
      { network: selectedWallet.network, walletId: selectedWallet.id },
      {
        onSuccess: (created) => {
          setQuote(created)
          setStaleDiff(null)
          setNotice(null)
          resetPlaceOrder()
        },
        onError: (error) => toast.error(errorMessage(error, 'Não foi possível revisar o pedido')),
      },
    )
  }

  const handlePlaceOrderError = (error: unknown, previousQuote: Quote | null) => {
    if (!(error instanceof ApiError)) return
    if (error.code !== 'QUOTE_STALE') {
      if (!error.isTransient) placeOrder.clearAttempt()
      return
    }
    const fresh = freshQuoteFrom(error.details)
    resetPlaceOrder()
    placeOrder.clearAttempt()
    if (fresh) {
      setStaleDiff(previousQuote ? { previous: previousQuote, next: fresh } : null)
      setQuote(fresh)
      setNotice(previousQuote ? null : 'A cotação foi atualizada. Revise os valores e confirme novamente.')
      return
    }
    setQuote(null)
    setStaleDiff(null)
    setReviewBuyer(null)
    setNotice('A cotação mudou e o carrinho precisa de ajustes. Volte ao carrinho para revisar.')
  }

  const resolveBuyerValues = (): CheckoutFormValues => {
    if (reviewBuyer) return reviewBuyer
    const draft = draftStore.get()
    return {
      displayName: draftText(draft, 'displayName') ?? initialValues.displayName,
      username: draftText(draft, 'username') ?? initialValues.username,
      profileName: draftText(draft, 'profileName') ?? initialValues.profileName,
      email: draftText(draft, 'email') ?? initialValues.email,
      note: draftText(draft, 'note') ?? initialValues.note,
    }
  }

  const confirm = () => {
    if (!quote || !selectedWallet || !selectedWallet.connected) return
    const buyerValues = resolveBuyerValues()
    const buyer = {
      ...buyerValues,
      network: selectedWallet.network,
      address: selectedWallet.address,
      secondaryAddress: selectedWallet.secondaryAddress,
      provider: selectedWallet.provider,
      referralCode: selectedWallet.referralCode,
      ensName: selectedWallet.ensName,
    }
    void placeOrder
      .placeOrder({
        quoteId: quote.id,
        walletId: selectedWallet.id,
        network: selectedWallet.network,
        buyer,
      })
      .catch((error: unknown) => handlePlaceOrderError(error, quote))
  }

  const backToEdit = () => {
    setQuote(null)
    setStaleDiff(null)
    setReviewBuyer(null)
    setNotice(null)
    createQuote.reset()
    resetPlaceOrder()
  }

  const retry = () => {
    if (!placeOrder.attempt) return
    void placeOrder.retry().catch((error: unknown) => handlePlaceOrderError(error, quote))
  }

  const otherWallet = !selectedWallet
    ? primaryWallet
    : selectedWallet.slot === 'secondary'
      ? primaryWallet
      : secondaryWallet
  const usingOtherWallet = selectedWallet?.slot === 'secondary'
  const toggleOtherWallet = () => {
    if (otherWallet) selectWallet(otherWallet)
  }

  const reason = unresolvedAttempt
    ? 'Conclua a tentativa de compra anterior com "Tentar novamente" antes de revisar outro pedido.'
    : !selectedWallet
      ? 'Selecione uma carteira para continuar.'
      : !selectedWallet.connected
        ? 'Conecte a carteira selecionada para continuar.'
        : blockedItem
          ? 'Ajuste os itens indisponíveis no carrinho para continuar.'
          : null

  const canProceed = reason === null

  return {
    step,
    quote,
    staleDiff,
    notice,
    reviewBuyer,
    initialValues,
    selectedWalletId,
    selectedWallet,
    primaryWallet,
    secondaryWallet,
    otherWallet,
    usingOtherWallet,
    blockedItem,
    placeError,
    uncertain,
    unconfirmedAttempt,
    unresolvedAttempt,
    reason,
    canProceed,
    isReviewing: createQuote.isPending,
    isSubmitting: placeOrder.isPending,
    reviewError: createQuote.error,
    busy: createQuote.isPending || placeOrder.isPending,
    persistDraft: handleValuesChange,
    review,
    confirm,
    retry,
    backToEdit,
    selectWallet,
    disconnectWallet,
    toggleOtherWallet,
  }
}
