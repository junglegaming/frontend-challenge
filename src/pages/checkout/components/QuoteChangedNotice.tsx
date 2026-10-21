import { Link } from '@tanstack/react-router'
import { AlertIcon } from '@/shared/icons'
import { eth } from '@/shared/lib/eth'
import type { QuoteChange } from '../model/quote-diff'
import { ISSUE_MESSAGE } from './OrderSummary'

/** Shows exactly what changed since the review and asks for a new confirmation (FR-011). */
export function QuoteChangedNotice({ change }: { change: QuoteChange }) {
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-sm border border-warning p-4 text-body">
      <p className="flex items-center gap-2 font-bold">
        <AlertIcon aria-hidden="true" className="size-4 shrink-0 text-warning" />
        Os valores do pedido mudaram. Revise e confirme novamente.
      </p>
      <ul className="flex flex-col gap-1 text-caption">
        {change.lines.map((line) => (
          <li key={line.itemId}>
            {line.name}: {eth.format(line.previous)} → {eth.format(line.current)}
          </li>
        ))}
        {change.removed.map((line) => (
          <li key={line.itemId}>{line.name} saiu do pedido.</li>
        ))}
        {change.issues.map((issue, index) => (
          <li key={index}>{ISSUE_MESSAGE[issue.type]}</li>
        ))}
        {change.networkFee && (
          <li>
            Taxa de rede: {eth.format(change.networkFee.previous)} → {eth.format(change.networkFee.current)}
          </li>
        )}
        {change.total && (
          <li className="font-bold">
            Total: {eth.format(change.total.previous)} → {eth.format(change.total.current)}
          </li>
        )}
      </ul>
      {change.blocking && (
        <p>
          Não é possível concluir a compra assim.{' '}
          <Link to="/cart" className="text-primary underline underline-offset-4">
            Ajustar carrinho
          </Link>
        </p>
      )}
    </div>
  )
}
