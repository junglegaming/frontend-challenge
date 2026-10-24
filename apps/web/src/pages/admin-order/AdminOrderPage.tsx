import { Link } from '@tanstack/react-router'
import { OrderStatusBadge, useAdminLogout, useAdminOrder } from '@/domains/admin'
import { isApiError } from '@/shared/api/http'
import { eth } from '@/shared/lib/eth'
import { AdminSideMenu } from '@/shared/ui/admin-side-menu'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-bold">{children}</dd>
    </div>
  )
}

/** Read-only detail of any user's order: the buyer's receipt content plus who bought it. */
export function AdminOrderPage({ orderId }: { orderId: string }) {
  const logout = useAdminLogout()
  const order = useAdminOrder(orderId)
  const notFound = order.isError && isApiError(order.error) && order.error.status === 404

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AdminSideMenu active="orders" onLogout={logout} />
      <section aria-labelledby="admin-order-title" className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="admin-order-title" className="text-title font-bold">
              Pedido
            </h1>
            <p className="break-all text-muted-foreground">{order.data?.id ?? ''}</p>
          </div>
          <Link to="/admin/orders" className="text-primary underline">
            Voltar para a lista
          </Link>
        </div>

        {order.isPending && <Skeleton aria-busy="true" aria-label="Carregando pedido" className="h-64 w-full" />}

        {notFound && (
          <p role="alert" className="text-destructive">
            Pedido não encontrado.
          </p>
        )}

        {order.isError && !notFound && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">
            <span>Não foi possível carregar o pedido.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void order.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {order.data && (
          <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Estado">
                <OrderStatusBadge status={order.data.status} />
              </Row>
              <Row label="Data">{dateFormat.format(new Date(order.data.createdAt))}</Row>
              <Row label="Comprador">
                {order.data.collector.fullName}
                <span className="block text-caption font-normal text-muted-foreground">{order.data.collector.email}</span>
                <span className="block text-caption font-normal text-muted-foreground">Usuário {order.data.userId}</span>
              </Row>
              <Row label="Carteira">
                {order.data.wallet.label}
                <span className="block break-all text-caption font-normal text-muted-foreground">{order.data.wallet.address}</span>
              </Row>
              <Row label="Rede">{order.data.network}</Row>
              {order.data.coupon && <Row label="Cupom">{order.data.coupon.code}</Row>}
              {order.data.declineReason && <Row label="Motivo da recusa">{order.data.declineReason}</Row>}
              {order.data.transaction && (
                <Row label="Transação">
                  <a href={order.data.transaction.explorerUrl} target="_blank" rel="noreferrer" className="break-all text-primary underline">
                    {order.data.transaction.hash}
                    <span className="sr-only"> (abre em nova guia)</span>
                  </a>
                </Row>
              )}
            </dl>

            <div>
              <h2 className="mb-3 text-body font-bold">Itens</h2>
              <ul className="flex flex-col gap-3">
                {order.data.lines.map((line, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <img src={line.image.src} alt={line.image.alt} width={40} height={40} className="size-10 rounded-sm object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground">{line.name}</p>
                      <p className="text-caption text-muted-foreground">
                        {line.editionName} (x {line.quantity}) · {eth.format(line.unitPrice)} cada
                      </p>
                    </div>
                    <p className="font-bold text-primary">{eth.format(line.lineTotal)}</p>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="flex flex-col gap-2 border-t border-border pt-4 text-body">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{eth.format(order.data.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd>{eth.format(order.data.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Taxa de rede</dt>
                <dd>{eth.format(order.data.networkFee)}</dd>
              </div>
              <div className="flex justify-between text-title font-bold">
                <dt>Total</dt>
                <dd>{eth.format(order.data.total)}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </PageContainer>
  )
}
