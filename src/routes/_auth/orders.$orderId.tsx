import { useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ApiError } from '@/api/client'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { OrderPending } from '@/components/order/OrderPending'
import { OrderReceipt } from '@/components/order/OrderReceipt'
import { OrderRejected } from '@/components/order/OrderRejected'
import { OrderSkeleton } from '@/components/order/OrderSkeleton'
import { useOrder } from '@/hooks/useCheckout'
import { pendingOrderStore } from '@/lib/storage'

export const Route = createFileRoute('/_auth/orders/$orderId')({
  component: Page,
})

function Page() {
  const { orderId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const order = useOrder(orderId)

  useEffect(() => {
    const data = order.data
    if (!data || data.status === 'pending') return
    const store = pendingOrderStore(user.id)
    if (store.get()?.orderId === data.id) store.set(null)
  }, [order.data, user.id])

  useEffect(() => {
    if (!(order.error instanceof ApiError) || order.error.code !== 'NOT_FOUND') return
    const store = pendingOrderStore(user.id)
    if (store.get()?.orderId === orderId) store.set(null)
  }, [order.error, orderId, user.id])

  const status = order.data?.status
  const announcement =
    status === 'pending'
      ? 'Aguardando confirmação da rede.'
      : status === 'confirmed'
        ? 'Pagamento confirmado. Seus NFTs estão na sua carteira.'
        : status === 'rejected'
          ? 'Pagamento recusado. Seus itens continuam no carrinho.'
          : ''

  return (
    <PageContainer className="py-8 md:py-16">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {order.isPending && <OrderSkeleton />}

      {order.isError &&
        (order.error instanceof ApiError && order.error.code === 'NOT_FOUND' ? (
          <OrderNotFound />
        ) : (
          <ErrorState
            error={order.error}
            title="Não foi possível carregar o pedido"
            onRetry={() => void order.refetch()}
            isRetrying={order.isFetching}
          />
        ))}

      {order.isSuccess && order.data.status === 'pending' && <OrderPending order={order.data} />}
      {order.isSuccess && order.data.status === 'confirmed' && (
        <OrderReceipt orderId={order.data.id} receipt={order.data.receipt} />
      )}
      {order.isSuccess && order.data.status === 'rejected' && (
        <OrderRejected receipt={order.data.receipt} reason={order.data.rejectionReason} />
      )}
    </PageContainer>
  )
}

function OrderNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[578px] flex-col items-center gap-4 py-10 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-base font-bold">Pedido não encontrado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Este pedido não existe ou pertence a outra conta. Confira o endereço ou volte ao catálogo.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/" hash="catalogo">
            Voltar ao catálogo
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/cart">Ir para o carrinho</Link>
        </Button>
      </div>
    </div>
  )
}
