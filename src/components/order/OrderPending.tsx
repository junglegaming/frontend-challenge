import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EthPrice } from '@/components/common/EthPrice'
import type { Order } from '@/schemas/order'

interface OrderPendingProps {
  order: Order
}

export function OrderPending({ order }: OrderPendingProps) {
  return (
    <section
      aria-labelledby="order-pending-heading"
      aria-busy="true"
      className="mx-auto w-full max-w-[578px] border border-border bg-card"
    >
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-full border border-primary/60 text-primary">
          <Loader2 className="size-7 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        </span>
        <h1 id="order-pending-heading" className="text-lg font-bold">
          Aguardando confirmação da rede…
        </h1>
        <p role="status" aria-live="polite" className="max-w-md text-sm text-muted-foreground">
          Estamos confirmando sua transação simulada. Esta tela é atualizada automaticamente quando o pedido for
          processado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-border px-6 py-4 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Pedido</p>
          <p className="font-bold break-all">{order.id}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Itens</p>
          <p className="font-bold">
            {order.receipt.items.length} {order.receipt.items.length === 1 ? 'NFT' : 'NFTs'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <EthPrice value={order.receipt.total} className="text-sm" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Carteira</p>
          <p className="font-bold">{order.receipt.walletLabel}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Você pode sair desta página com segurança. O pedido continuará disponível neste endereço.
        </p>
        <Button asChild variant="outline" className="h-12 rounded-full md:h-10 md:rounded-sm">
          <Link to="/cart">Voltar ao carrinho</Link>
        </Button>
      </div>
      <div className="h-2.5 w-full bg-primary" aria-hidden="true" />
    </section>
  )
}
