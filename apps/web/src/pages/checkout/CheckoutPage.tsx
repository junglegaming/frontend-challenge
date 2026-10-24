import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/domains/auth'
import { cartQueries, useCartQuote } from '@/domains/cart'
import { idempotencyKeyFor, rotateIdempotencyKey } from '@/domains/checkout'
import {
  coinsKeys,
  invalidateLedger,
  LedgerError,
  ledgerCredit,
  ledgerDebit,
  ledgerErrorMessage,
  ledgerKeys,
  toCoinsAmount,
  type LedgerBalance,
} from '@/domains/ledger'
import { useCreateOrder } from '@/domains/orders'
import type { Network } from '@/domains/wallets'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'
import { CheckoutLoadError } from './components/CheckoutLoadError'
import { CollectorForm, useCollectorForm, type CollectorFormValues } from './components/CollectorForm'
import { OrderSummary } from './components/OrderSummary'
import { PaymentMethodPicker, type PaymentMethod } from './components/PaymentMethodPicker'
import { WalletPicker } from './components/WalletPicker'

const FALLBACK_NETWORK: Network = 'ethereum'

/** Coins to give back after a definitely rejected order; kept so the collector can retry with the same key. */
interface PendingRefund {
  userId: string
  amount: number
  key: string
  quoteSignature: string
}

interface CoinsNotice {
  message: string
  refund?: PendingRefund
}

/** The order system answered that it did not create the order (4xx): safe to give the coins back. */
function isDefiniteRejection(error: unknown) {
  return isApiError(error) && error.status !== null && error.status >= 400 && error.status < 500
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useSession()
  const cart = useQuery(cartQueries.view())
  const form = useCollectorForm()
  const network = (form.watch('network') || FALLBACK_NETWORK) as Network
  const quote = useCartQuote(network)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet')
  const [submitting, setSubmitting] = useState(false)
  const [coinsNotice, setCoinsNotice] = useState<CoinsNotice | null>(null)
  // A ref, not state: a double click reaches the handler before React re-renders the disabled button.
  const inFlight = useRef(false)
  const createOrder = useCreateOrder()

  useEffect(() => {
    if (cart.data && cart.data.items.length === 0) void navigate({ to: '/cart' })
  }, [cart.data, navigate])

  /** Credits the coins of a rejected order back. Rotates the quote's key only once the coins are back. */
  async function giveCoinsBack(refund: PendingRefund) {
    try {
      await ledgerCredit(refund.userId, refund.amount, refund.key)
      rotateIdempotencyKey(refund.quoteSignature)
      setCoinsNotice(null)
      toast.success('Pedido não criado; suas moedas foram devolvidas.')
    } catch {
      setCoinsNotice({ message: 'Suas moedas ainda não voltaram.', refund })
    } finally {
      void invalidateLedger(queryClient, refund.userId)
    }
  }

  async function submit(values: CollectorFormValues) {
    if (!quote.data) return
    if (!quote.data.purchasable) {
      toast.error('Revise seu carrinho: alguns itens não podem ser finalizados.')
      return
    }
    if (!walletId) {
      toast.error('Selecione ou adicione uma carteira para continuar.')
      return
    }

    const fresh = await quote.refetch()
    if (!fresh.data?.purchasable || fresh.data.signature !== quote.data.signature) {
      toast.error('Os valores do pedido mudaram. Revise e confirme novamente.')
      return
    }

    const quoteSignature = fresh.data.signature
    const idempotencyKey = idempotencyKeyFor(quoteSignature)

    // Paying with coins debits the real coins service before the order exists (the two systems share no
    // transaction). The debit key derives from the order key, so retrying the same order replays the debit
    // instead of charging twice (specs/011-web-coins-real-api/data-model.md, "Estados do pagamento com moedas").
    let coins: { userId: string; amount: number; keys: ReturnType<typeof coinsKeys> } | null = null
    if (paymentMethod === 'coins') {
      const userId = session.data?.user.id
      if (!userId) return // unreachable on a protected route, but keeps the branch exhaustive
      const amount = toCoinsAmount(fresh.data.total)
      const keys = coinsKeys(idempotencyKey)
      setCoinsNotice(null)
      try {
        await ledgerDebit(userId, amount, keys.debit)
      } catch (error) {
        const balance = queryClient.getQueryData<LedgerBalance>(ledgerKeys.balance(userId))?.amount
        const insufficient = error instanceof LedgerError && error.isInsufficientBalance
        setCoinsNotice({ message: ledgerErrorMessage(error, insufficient ? { balance, required: amount } : undefined) })
        return
      } finally {
        void invalidateLedger(queryClient, userId)
      }
      coins = { userId, amount, keys }
    }

    try {
      const order = await createOrder.mutateAsync({
        quoteSignature,
        network,
        walletId,
        collector: { fullName: values.fullName, email: values.email, country: 'BR', note: values.note },
        idempotencyKey,
      })
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (error) {
      if (coins !== null) {
        if (isDefiniteRejection(error)) {
          await giveCoinsBack({ userId: coins.userId, amount: coins.amount, key: coins.keys.refund, quoteSignature })
        } else {
          // Ambiguous (network, timeout, 5xx): the order may exist, so the coins stay debited. A retry reuses the
          // same keys, which replays both the debit and the order without a new effect.
          setCoinsNotice({ message: 'Não confirmamos a compra. Confira seus pedidos antes de tentar de novo.' })
        }
      }
      toast.error(isApiError(error) ? error.message : 'Não foi possível confirmar a compra.')
      // A stale-quote rejection (price/stock changed server-side) must update what's on screen,
      // not just the toast — otherwise the user "reviews" a total that's already wrong.
      void quote.refetch()
    }
  }

  async function onSubmit(values: CollectorFormValues) {
    if (inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    try {
      await submit(values)
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  if (cart.isError || quote.isError) {
    return (
      <CheckoutLoadError
        onRetry={() => {
          void cart.refetch()
          void quote.refetch()
        }}
      />
    )
  }

  const pendingRefund = coinsNotice?.refund

  return (
    <PageContainer className="py-8">
      <h1 className="mb-8 text-title font-bold">Pagamento</h1>
      {/* Not a <form>: WalletPicker can render its own nested wallet-creation form, and HTML forbids nested forms. */}
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-10">
          <CollectorForm form={form} />
          <WalletPicker selectedWalletId={walletId} onSelect={setWalletId} />
          {quote.data && (
            <PaymentMethodPicker method={paymentMethod} onMethodChange={setPaymentMethod} coinsRequired={toCoinsAmount(quote.data.total)} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {quote.isPending && <Skeleton className="h-96 w-full" />}
          {quote.data && <OrderSummary quote={quote.data} />}
          <Button
            type="button"
            size="lg"
            disabled={submitting || createOrder.isPending || quote.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {submitting || createOrder.isPending ? 'Confirmando…' : 'Confirmar compra'}
          </Button>
          {coinsNotice && (
            <div role="alert" className="flex flex-col gap-2 text-destructive">
              <p>{coinsNotice.message}</p>
              {pendingRefund && (
                <Button type="button" variant="outline" onClick={() => void giveCoinsBack(pendingRefund)}>
                  Devolver moedas de novo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
