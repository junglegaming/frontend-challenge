import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ledgerErrorMessage, useLedgerBalance, useLedgerTopUp, useLedgerTransactions } from '@/domains/ledger'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'

const HISTORY_SIZE = 5

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Coins balance, recent history and top-up, served by the real backend through `/backend`
 * (specs/011-web-coins-real-api, US1). Every top-up carries an idempotency key per intent: retrying the same
 * amount after a failure reuses it, so the coins are credited once even if the first response was lost.
 */
export function CoinsBalanceSection() {
  const balance = useLedgerBalance()
  const transactions = useLedgerTransactions(HISTORY_SIZE)
  const topUp = useLedgerTopUp()
  const [amount, setAmount] = useState('')
  const [topUpError, setTopUpError] = useState<string | null>(null)
  // The key of the top-up the user is trying to make; kept until it succeeds or the amount changes.
  const intent = useRef<{ amount: number; key: string } | null>(null)

  function onAmountChange(value: string) {
    setAmount(value)
    setTopUpError(null)
    intent.current = null
  }

  function onTopUp() {
    const parsed = Number(amount)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setTopUpError('Informe um valor inteiro positivo de moedas.')
      return
    }
    if (topUp.isPending) return
    if (intent.current?.amount !== parsed) intent.current = { amount: parsed, key: crypto.randomUUID() }

    setTopUpError(null)
    topUp.mutate(
      { amount: parsed, idempotencyKey: intent.current.key },
      {
        onSuccess: () => {
          intent.current = null
          toast.success(`${parsed} moedas adicionadas ao seu saldo.`)
          setAmount('')
        },
        onError: (error) => setTopUpError(ledgerErrorMessage(error)),
      },
    )
  }

  return (
    <section aria-labelledby="coins-balance-title" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 id="coins-balance-title" className="text-title font-bold">
          Moedas da Kurio
        </h2>
        <p className="text-muted-foreground">Uma moeda alternativa à carteira para comprar NFTs na plataforma.</p>
      </div>

      {balance.isPending && <Skeleton className="h-10 w-32" />}
      {balance.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">
          <span>{ledgerErrorMessage(balance.error)}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void balance.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}
      {balance.data && (
        <p className="text-title font-bold text-primary" aria-live="polite">
          {balance.data.amount} moedas
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="coins-topup-amount" className="text-body">
            Recarregar moedas
          </label>
          <Input
            id="coins-topup-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            aria-describedby={topUpError ? 'coins-topup-error' : undefined}
            className="w-32"
          />
        </div>
        <Button type="button" disabled={topUp.isPending} onClick={onTopUp}>
          {topUp.isPending ? 'Recarregando…' : 'Recarregar'}
        </Button>
      </div>
      {topUpError && (
        <p id="coins-topup-error" role="alert" className="text-destructive">
          {topUpError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-body font-bold">Últimas operações</h3>
        {transactions.isPending && <Skeleton className="h-16 w-full" />}
        {transactions.data && transactions.data.length === 0 && (
          <p className="text-muted-foreground">Nenhuma operação ainda.</p>
        )}
        {transactions.data && transactions.data.length > 0 && (
          <ul aria-label="Histórico de moedas" className="flex flex-col gap-1">
            {transactions.data.map((tx) => (
              <li key={tx.txId} className="flex flex-wrap justify-between gap-2 text-body">
                <span>
                  {tx.direction === 'credit' ? 'Crédito' : 'Débito'} de {tx.amount} moedas
                </span>
                <span className="text-muted-foreground">
                  saldo {tx.resultingBalance} · {dateFormat.format(new Date(tx.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
