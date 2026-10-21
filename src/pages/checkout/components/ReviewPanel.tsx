import { NETWORK_LABELS, PROVIDER_LABELS, type Network, type Wallet } from '@/domains/wallets'
import type { CollectorFormValues } from './CollectorForm'

/** Review step (FR-009): who pays, with which wallet and network. Values come from the summary beside it. */
export function ReviewPanel({
  collector,
  wallet,
  network,
}: {
  collector: CollectorFormValues
  wallet: Wallet | undefined
  network: Network
}) {
  return (
    <section aria-labelledby="review-heading" className="flex flex-col gap-6">
      <h2 id="review-heading" tabIndex={-1} className="text-title font-bold outline-none">
        Revise seu pedido
      </h2>
      <dl className="grid gap-4 text-body sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">Nome de exibição</dt>
          <dd className="break-words">{collector.fullName}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">E-mail</dt>
          <dd className="break-words">{collector.email}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">Carteira</dt>
          <dd className="break-words">
            {wallet
              ? `${wallet.label} (${PROVIDER_LABELS[wallet.provider]}) — ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
              : '—'}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-muted-foreground">Rede</dt>
          <dd>{NETWORK_LABELS[network]}</dd>
        </div>
        {collector.note && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-caption text-muted-foreground">Observação</dt>
            <dd className="break-words">{collector.note}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
