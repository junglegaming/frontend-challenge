import type { Order } from '@/domains/orders'
import { Button } from '@/shared/ui/button'
import { eth } from '@/shared/lib/eth'

export function Receipt({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-title font-bold">Obrigado!</p>
        <p className="text-muted-foreground">Seus NFTs agora estão na sua carteira</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 text-body sm:grid-cols-4">
        <div>
          <dt className="text-caption text-muted-foreground">ID da transação</dt>
          <dd className="font-bold">{order.transaction ? `${order.transaction.hash.slice(0, 8)}…${order.transaction.hash.slice(-4)}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">Data</dt>
          <dd className="font-bold">{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">Total</dt>
          <dd className="font-bold">{eth.format(order.total)}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">Carteira</dt>
          <dd className="font-bold">{order.wallet.label}</dd>
        </div>
      </dl>

      <div>
        <h2 className="mb-3 text-body font-bold">Detalhes da transação</h2>
        <ul className="flex flex-col gap-3">
          {order.lines.map((line, index) => (
            <li key={index} className="flex items-center gap-3">
              <img src={line.image.src} alt={line.image.alt} width={40} height={40} className="size-10 rounded-sm object-cover" />
              <div className="flex-1">
                <p className="font-bold text-foreground">{line.name}</p>
                <p className="text-caption text-muted-foreground">(x {line.quantity})</p>
              </div>
              <p className="font-bold text-primary">{eth.format(line.lineTotal)}</p>
            </li>
          ))}
        </ul>
      </div>

      <dl className="flex flex-col gap-2 border-t border-border pt-4 text-body">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Taxa de rede</dt>
          <dd>{eth.format(order.networkFee)}</dd>
        </div>
        <div className="flex justify-between text-title font-bold">
          <dt>Total</dt>
          <dd>{eth.format(order.total)}</dd>
        </div>
      </dl>

      <p className="text-center text-muted-foreground">
        Transação confirmada na rede. A propriedade foi transferida para sua carteira conectada e registrada na rede.
      </p>

      {order.transaction && (
        <Button asChild className="self-center">
          <a href={order.transaction.explorerUrl} target="_blank" rel="noreferrer">
            Ver no Etherscan <span className="sr-only">(abre em nova guia)</span>
          </a>
        </Button>
      )}
    </div>
  )
}
