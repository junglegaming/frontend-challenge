import { useOrder } from '@/domains/orders'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'
import { DeclinedState } from './components/DeclinedState'
import { NotFoundState } from './components/NotFoundState'
import { PendingState } from './components/PendingState'
import { Receipt } from './components/Receipt'

export function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const order = useOrder(orderId)

  return (
    <PageContainer className="flex max-w-2xl flex-col gap-6 py-8">
      {order.isPending && <Skeleton className="h-96 w-full" />}
      {order.isError && <NotFoundState />}
      {order.data?.status === 'pending' && <PendingState />}
      {order.data?.status === 'declined' && <DeclinedState reason={order.data.declineReason} />}
      {order.data?.status === 'confirmed' && <Receipt order={order.data} />}
    </PageContainer>
  )
}
