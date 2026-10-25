import { Link } from '@tanstack/react-router'
import { OctagonX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EthPrice } from '@/components/common/EthPrice'
import type { Receipt } from '@/schemas/order'

interface OrderRejectedProps {
  receipt: Receipt
  reason: string | null
}

export function OrderRejected({ receipt, reason }: OrderRejectedProps) {
  return (
    <section
      aria-labelledby="order-rejected-heading"
      className="mx-auto w-full max-w-[578px] border border-border bg-card"
    >
      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="grid size-20 place-items-center rounded-sm border border-destructive/60 text-destructive">
          <OctagonX className="size-9" aria-hidden="true" />
        </span>
        <h1 id="order-rejected-heading" className="text-base font-bold">
          Pagamento recusado
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {reason ?? 'A carteira recusou a assinatura da transação. Nenhum valor foi transferido.'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-y border-border px-6 py-4">
        <span className="text-sm text-muted-foreground">Total do pedido</span>
        <EthPrice value={receipt.total} />
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Seus itens continuam reservados no carrinho. Você pode revisar e tentar novamente.
        </p>
        <Button asChild className="h-12 rounded-full md:h-10 md:rounded-sm">
          <Link to="/cart">Voltar ao carrinho</Link>
        </Button>
      </div>

      <div className="h-2.5 w-full bg-primary" aria-hidden="true" />
    </section>
  )
}
