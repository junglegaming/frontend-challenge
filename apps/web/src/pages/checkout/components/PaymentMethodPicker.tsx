import { LedgerError, ledgerErrorMessage, useLedgerBalance } from '@/domains/ledger'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Skeleton } from '@/shared/ui/skeleton'

export type PaymentMethod = 'wallet' | 'coins'

// A local 402 so the hint uses exactly the message the debit would produce (one wording, data-model "Erro").
const insufficientBalance = new LedgerError({ status: 402, code: 'insufficient_balance', message: '' })

/**
 * Only the "which currency pays" choice — a connected wallet is still selected separately and
 * unconditionally elsewhere on the page, since the purchased NFT needs a receiving wallet
 * regardless of which currency settled the payment (`CreateOrderRequest.walletId` is always
 * required).
 */
export function PaymentMethodPicker({
  method,
  onMethodChange,
  coinsRequired,
}: {
  method: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  coinsRequired: number
}) {
  const coinsBalance = useLedgerBalance()
  const insufficientCoins = coinsBalance.data !== undefined && coinsBalance.data.amount < coinsRequired

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-title font-bold">Forma de pagamento</h2>

      <RadioGroup value={method} onValueChange={(value) => onMethodChange(value as PaymentMethod)} aria-label="Forma de pagamento">
        <label htmlFor="payment-wallet" className="flex cursor-pointer items-center gap-3 rounded-sm border border-border p-3 text-body">
          <RadioGroupItem id="payment-wallet" value="wallet" />
          Pagar com a carteira conectada (ETH)
        </label>
        <label htmlFor="payment-coins" className="flex cursor-pointer items-center gap-3 rounded-sm border border-border p-3 text-body">
          <RadioGroupItem id="payment-coins" value="coins" />
          Pagar com moedas da Kurio
        </label>
      </RadioGroup>

      {method === 'coins' && (
        <div className="flex flex-col gap-2 rounded-sm border border-border p-3">
          {coinsBalance.isPending && <Skeleton className="h-6 w-32" />}
          {coinsBalance.isError && (
            <p role="alert" className="text-destructive">
              {ledgerErrorMessage(coinsBalance.error)}
            </p>
          )}
          {coinsBalance.data && (
            <p aria-live="polite">
              Saldo atual: <strong>{coinsBalance.data.amount} moedas</strong> · Custo desta compra:{' '}
              <strong>{coinsRequired} moedas</strong>
            </p>
          )}
          {insufficientCoins && coinsBalance.data && (
            <p role="alert" className="text-destructive">
              {ledgerErrorMessage(insufficientBalance, { balance: coinsBalance.data.amount, required: coinsRequired })} Recarregue
              em Carteiras ou escolha pagar com a carteira.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
