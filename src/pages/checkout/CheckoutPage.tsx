import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/domains/auth'
import { cartQueries, DEFAULT_QUOTE_NETWORK, useCartQuote, type Quote } from '@/domains/cart'
import { useCreateOrder, type CreateOrderRequest } from '@/domains/orders'
import { useProfile } from '@/domains/profile'
import { NETWORKS, useWallets, type Network } from '@/domains/wallets'
import { isApiError, type ApiError } from '@/shared/api/http'
import { setSessionToken } from '@/shared/api/session'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { LiveRegion, SummarySkeleton } from './components/CheckoutSkeleton'
import { CollectorForm, useCollectorForm, type CollectorFormValues } from './components/CollectorForm'
import { DeclinedOutcome, PendingOutcome } from './components/OrderOutcome'
import { OrderSummary } from './components/OrderSummary'
import { QuoteChangedNotice } from './components/QuoteChangedNotice'
import { ReviewPanel } from './components/ReviewPanel'
import { WalletPicker } from './components/WalletPicker'
import { useCheckoutRealtime } from './hooks/use-checkout-realtime'
import { useOrderOutcome } from './hooks/use-order-outcome'
import { useWalletConnection } from './hooks/use-wallet-connection'
import { checkoutReducer, initialCheckoutState } from './model/checkout-flow'
import { readDraft, writeDraft, type CheckoutDraft } from './model/checkout-draft'
import { diffQuotes } from './model/quote-diff'

const TIMEOUT_MESSAGE = 'Não recebemos a confirmação a tempo. Tente novamente — o mesmo pedido será recuperado.'
const SESSION_MESSAGE = 'Sua sessão expirou. Entre novamente para concluir a compra; seus dados foram guardados.'

const toNetwork = (value: string | undefined): Network | null =>
  (NETWORKS as readonly string[]).includes(value ?? '') ? (value as Network) : null

const isAuthError = (error: unknown): error is ApiError => isApiError(error) && error.isAuthError

export function CheckoutPage() {
  const session = useSession()
  const userId = session.data?.user.id

  if (!userId) {
    return (
      <PageContainer className="py-8">
        <h1 className="mb-8 text-title font-bold">Pagamento</h1>
        <SummarySkeleton />
      </PageContainer>
    )
  }
  // Keyed by user: another collector never inherits this one's draft, form or connection.
  return <Checkout key={userId} userId={userId} />
}

function Checkout({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draft] = useState(() => readDraft(userId))
  const meta = useRef<Pick<CheckoutDraft, 'attempt' | 'pendingOrderId'>>({
    attempt: draft?.attempt ?? null,
    pendingOrderId: draft?.pendingOrderId ?? null,
  })

  const form = useCollectorForm({
    fullName: draft?.collector.fullName ?? '',
    email: draft?.collector.email ?? '',
    note: draft?.collector.note ?? '',
    network: draft?.network ?? undefined,
    walletId: draft?.walletId ?? '',
  })
  const network = toNetwork(form.watch('network'))
  const walletId = form.watch('walletId') || null

  const [state, dispatch] = useReducer(checkoutReducer, draft?.pendingOrderId ?? null, (pendingOrderId) =>
    pendingOrderId ? checkoutReducer(initialCheckoutState, { type: 'RESUME_PENDING', orderId: pendingOrderId }) : initialCheckoutState,
  )

  const cart = useQuery(cartQueries.view())
  const quote = useCartQuote(network ?? DEFAULT_QUOTE_NETWORK)
  const wallets = useWallets()
  const profile = useProfile()
  const createOrder = useCreateOrder()
  const connection = useWalletConnection()
  const [announcement, setAnnouncement] = useState('')
  const [walletError, setWalletError] = useState<string | undefined>()

  // --- Draft persistence (FR-019) -------------------------------------------------------------
  const persist = useCallback(
    (extra?: Partial<typeof meta.current>) => {
      if (extra) meta.current = { ...meta.current, ...extra }
      const values = form.getValues()
      writeDraft({
        userId,
        collector: { fullName: values.fullName, email: values.email, note: values.note },
        network: toNetwork(values.network),
        walletId: values.walletId || null,
        ...meta.current,
      })
    },
    [form, userId],
  )

  useEffect(() => {
    const subscription = form.watch(() => persist())
    return () => subscription.unsubscribe()
  }, [form, persist])

  const sessionExpired = useRef(false)
  const handleAuthError = useCallback(() => {
    if (sessionExpired.current) return
    sessionExpired.current = true
    persist()
    setSessionToken(null)
    // Same as logout: no private cache of this collector may survive into the next session.
    queryClient.clear()
    toast.error(SESSION_MESSAGE)
    void navigate({ to: '/login', search: { redirect: '/checkout' } })
  }, [persist, queryClient, navigate])

  // --- Profile prefill (R7): only fills what is still empty -----------------------------------
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !profile.data) return
    prefilled.current = true
    if (!form.getValues('fullName')) form.setValue('fullName', profile.data.name)
    if (!form.getValues('email')) form.setValue('email', profile.data.email)
  }, [profile.data, form])

  // --- Wallet / network changes undo the connection and the review (FR-008) ------------------
  const { state: connectionState, disconnect } = connection
  useEffect(() => {
    if (connectionState.status === 'idle') return
    if (connectionState.walletId !== walletId || connectionState.network !== network) {
      disconnect()
      dispatch({ type: 'WALLET_CHANGED' })
    }
  }, [walletId, network, connectionState, disconnect])

  const selectWallet = useCallback(
    (id: string) => form.setValue('walletId', id, { shouldValidate: form.formState.isSubmitted }),
    [form],
  )

  // --- Auth errors from any query of the page --------------------------------------------------
  useEffect(() => {
    if (isAuthError(quote.error) || isAuthError(cart.error) || isAuthError(wallets.error)) handleAuthError()
  }, [quote.error, cart.error, wallets.error, handleAuthError])

  // --- Empty cart → back to the cart (edge case) ----------------------------------------------
  useEffect(() => {
    // Only trust a cart fetched by this page: a cached guest cart from before a re-login may be empty.
    if (state.step === 'form' && cart.isFetchedAfterMount && cart.data?.items.length === 0) {
      toast.info('Seu carrinho está vazio.')
      void navigate({ to: '/cart' })
    }
  }, [state.step, cart.isFetchedAfterMount, cart.data, navigate])

  // --- Focus the heading of each step ---------------------------------------------------------
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const id = state.step === 'review' ? 'review-heading' : state.step === 'form' ? 'checkout-heading' : 'outcome-heading'
    document.getElementById(id)?.focus()
  }, [state.step])

  // --- Realtime: an item being bought changed (R4) --------------------------------------------
  function applyFreshQuote(fresh: Quote) {
    // An unanswered order may already exist and have reserved its stock: that change is ours.
    if (meta.current.attempt?.unanswered) return
    if (state.step === 'review' && fresh.signature !== state.reviewedQuote.signature) {
      dispatch({ type: 'QUOTE_CHANGED', change: diffQuotes(state.reviewedQuote, fresh), quote: fresh })
      setAnnouncement('Os valores do pedido mudaram. Revise e confirme novamente.')
    } else if (state.step === 'form') {
      setAnnouncement('O resumo foi atualizado.')
    }
  }

  useCheckoutRealtime(quote.data, () => {
    void quote.refetch().then((result) => {
      if (result.data) applyFreshQuote(result.data)
    })
  })

  // --- Idempotency: one key per attempt, kept across refresh/timeout (R5) ----------------------
  function keyFor(signature: string) {
    const attempt = meta.current.attempt
    if (attempt?.signature === signature) return attempt.key
    const key = crypto.randomUUID()
    persist({ attempt: { signature, key, unanswered: null } })
    return key
  }

  /**
   * Sends (or replays) an order. Until the backend answers, the exact request stays in the draft:
   * after a timeout or a refresh it is replayed with the same key and returns the same order.
   */
  async function sendOrder(request: CreateOrderRequest, idempotencyKey: string) {
    const attempt = meta.current.attempt
    if (attempt) persist({ attempt: { ...attempt, unanswered: request } })
    const order = await createOrder.mutateAsync({ ...request, idempotencyKey })
    persist({ attempt: meta.current.attempt && { ...meta.current.attempt, unanswered: null }, pendingOrderId: order.id })
    setAnnouncement('Pedido enviado. Aguardando a confirmação do pagamento.')
    return order
  }

  /** The backend definitively answered with an error: the request is no longer in flight. */
  function forgetUnanswered() {
    const attempt = meta.current.attempt
    if (attempt?.unanswered) persist({ attempt: { ...attempt, unanswered: null } })
  }

  // Reopened with an unanswered request (refresh after a timeout): replay it to recover the order.
  const resumed = useRef(false)
  useEffect(() => {
    const attempt = meta.current.attempt
    if (resumed.current || state.step !== 'form' || !attempt?.unanswered) return
    resumed.current = true
    sendOrder(attempt.unanswered, attempt.key).then(
      (order) => dispatch({ type: 'RESUME_PENDING', orderId: order.id }),
      (error: unknown) => {
        if (isAuthError(error)) return handleAuthError()
        if (!(isApiError(error) && (error.code === 'TIMEOUT' || error.code === 'NETWORK'))) forgetUnanswered()
      },
    )
  })

  // --- Step: form → review --------------------------------------------------------------------
  async function startReview() {
    if (!connection.isConnectedTo(walletId, network)) {
      setWalletError('Conecte a carteira na rede escolhida para continuar.')
      document.getElementById('wallet-heading')?.focus()
      return
    }
    const fresh = await quote.refetch()
    if (isAuthError(fresh.error)) return handleAuthError()
    if (!fresh.data) {
      toast.error('Não foi possível atualizar os valores. Tente novamente.')
      return
    }
    if (!fresh.data.purchasable) {
      toast.error('Revise seu carrinho: alguns itens não podem ser finalizados.')
      return
    }
    dispatch({ type: 'NEXT', quote: fresh.data })
  }

  function goToReview() {
    void form.handleSubmit(startReview, (errors) => {
      if (errors.walletId && Object.keys(errors).length === 1) document.getElementById('wallet-heading')?.focus()
    })()
  }

  // --- Step: review → order -------------------------------------------------------------------
  // A double click lands before React re-renders the disabled button; this guard is synchronous.
  const inFlight = useRef(false)
  function onConfirmClick() {
    if (inFlight.current) return
    inFlight.current = true
    void form.handleSubmit(confirmPurchase)().finally(() => {
      inFlight.current = false
    })
  }

  async function confirmPurchase(values: CollectorFormValues) {
    if (state.step !== 'review' || !network || !walletId) return
    const reviewed = state.reviewedQuote
    dispatch({ type: 'CONFIRM' })
    setAnnouncement('Enviando pedido…')

    // Retry after a timeout: the order may already exist, so replay the very same request.
    const attempt = meta.current.attempt
    if (attempt?.unanswered) {
      try {
        const order = await sendOrder(attempt.unanswered, attempt.key)
        return dispatch({ type: 'ORDER_CREATED', orderId: order.id })
      } catch (error) {
        if (isAuthError(error)) return handleAuthError()
        const timedOut = isApiError(error) && (error.code === 'TIMEOUT' || error.code === 'NETWORK')
        if (!timedOut) forgetUnanswered()
        return dispatch({ type: 'SUBMIT_FAILED', message: timedOut ? TIMEOUT_MESSAGE : 'Não foi possível confirmar a compra.' })
      }
    }

    const fresh = await quote.refetch()
    if (isAuthError(fresh.error)) return handleAuthError()
    if (!fresh.data) return dispatch({ type: 'SUBMIT_FAILED', message: 'Não foi possível revalidar os valores. Tente novamente.' })
    if (fresh.data.signature !== reviewed.signature || !fresh.data.purchasable) {
      setAnnouncement('Os valores do pedido mudaram. Revise e confirme novamente.')
      return dispatch({ type: 'QUOTE_CHANGED', change: diffQuotes(reviewed, fresh.data), quote: fresh.data })
    }
    if (!connection.isConnectedTo(walletId, network)) {
      return dispatch({ type: 'SUBMIT_FAILED', message: 'A carteira foi desconectada. Volte e conecte novamente.' })
    }

    try {
      const request: CreateOrderRequest = {
        quoteSignature: fresh.data.signature,
        network,
        walletId,
        collector: { fullName: values.fullName, email: values.email, country: 'BR', note: values.note || undefined },
      }
      const order = await sendOrder(request, keyFor(fresh.data.signature))
      dispatch({ type: 'ORDER_CREATED', orderId: order.id })
    } catch (error) {
      if (isAuthError(error)) return handleAuthError()
      const timedOut = isApiError(error) && (error.code === 'TIMEOUT' || error.code === 'NETWORK')
      if (!timedOut) forgetUnanswered()
      if (isApiError(error) && (error.code === 'QUOTE_STALE' || error.code === 'AVAILABILITY_CONFLICT')) {
        const again = await quote.refetch()
        if (again.data) {
          setAnnouncement('Os valores do pedido mudaram. Revise e confirme novamente.')
          return dispatch({ type: 'QUOTE_CHANGED', change: diffQuotes(reviewed, again.data), quote: again.data })
        }
      }
      if (isApiError(error) && error.code === 'VALIDATION_ERROR') {
        for (const [field, message] of Object.entries(error.fields)) {
          if (field in values) form.setError(field as keyof CollectorFormValues, { message })
        }
        dispatch({ type: 'SUBMIT_FAILED', message: error.message })
        return dispatch({ type: 'BACK' })
      }
      const message = timedOut
        ? TIMEOUT_MESSAGE
        : isApiError(error)
            ? error.message
            : 'Não foi possível confirmar a compra.'
      dispatch({ type: 'SUBMIT_FAILED', message })
      setAnnouncement(message)
    }
  }

  function retryAfterDecline() {
    persist({ attempt: null, pendingOrderId: null })
    void queryClient.invalidateQueries({ queryKey: cartQueries.quote(network ?? DEFAULT_QUOTE_NETWORK).queryKey })
    dispatch({ type: 'RETRY' })
  }

  function onDeclined(reason: string) {
    persist({ pendingOrderId: null })
    dispatch({ type: 'ORDER_DECLINED', reason })
    setAnnouncement(`Pagamento recusado. ${reason}`)
  }

  // --- Render ---------------------------------------------------------------------------------
  const summaryQuote = state.step === 'review' || state.step === 'submitting' ? state.reviewedQuote : quote.data
  const change = state.step === 'review' ? state.change : null
  const selectedWallet = wallets.data?.find((w) => w.id === walletId)

  return (
    <PageContainer className="py-8">
      <h1 id="checkout-heading" tabIndex={-1} className="mb-8 text-title font-bold outline-none">
        Pagamento
      </h1>
      <LiveRegion message={announcement} />

      {/* Not a <form>: WalletPicker can render its own nested wallet-creation form, and HTML forbids nested forms. */}
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-10">
          {state.step === 'form' && (
            <>
              <CollectorForm form={form} />
              <WalletPicker
                selectedWalletId={walletId}
                network={network}
                connection={connection.state}
                error={form.formState.errors.walletId?.message ?? (connection.state.status === 'connected' ? undefined : walletError)}
                onSelect={selectWallet}
                onConnect={() => walletId && network && connection.connect(walletId, network)}
                onDisconnect={connection.disconnect}
              />
            </>
          )}

          {(state.step === 'review' || state.step === 'submitting') && network && (
            <>
              <ReviewPanel collector={form.getValues()} wallet={selectedWallet} network={network} />
              <Button
                type="button"
                variant="outline"
                className="self-start"
                disabled={state.step === 'submitting'}
                onClick={() => dispatch({ type: 'BACK' })}
              >
                Voltar e editar
              </Button>
            </>
          )}

          {state.step === 'pending' && <PendingTracker orderId={state.orderId} onDeclined={onDeclined} />}
          {state.step === 'declined' && <DeclinedOutcome reason={state.reason} onRetry={retryAfterDecline} />}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {summaryQuote ? (
            <OrderSummary quote={summaryQuote} change={change} />
          ) : quote.isError ? (
            <div role="alert" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
              <p>Não foi possível carregar os valores do pedido.</p>
              <Button type="button" variant="outline" onClick={() => void quote.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <SummarySkeleton />
          )}

          {change && <QuoteChangedNotice change={change} />}

          {state.step === 'review' && state.error && (
            <p role="alert" className="text-caption text-destructive">
              {state.error}
            </p>
          )}

          {state.step === 'form' && (
            <Button type="button" size="lg" disabled={quote.isPending} onClick={goToReview}>
              Revisar pedido
            </Button>
          )}
          {(state.step === 'review' || state.step === 'submitting') && (
            <Button
              type="button"
              size="lg"
              disabled={state.step === 'submitting' || change?.blocking === true}
              onClick={onConfirmClick}
            >
              {state.step === 'submitting' ? 'Confirmando…' : 'Confirmar compra'}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

/** Separate component so `useOrder` only subscribes while an order is actually pending. */
function PendingTracker({ orderId, onDeclined }: { orderId: string; onDeclined: (reason: string) => void }) {
  useOrderOutcome(orderId, onDeclined)
  return <PendingOutcome orderId={orderId} />
}
