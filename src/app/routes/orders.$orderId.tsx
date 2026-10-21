import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/domains/auth'
import { OrderConfirmationPage } from '@/pages/order-confirmation'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: ({ location }) => requireSession(location.href),
  component: OrderConfirmationRoute,
})

function OrderConfirmationRoute() {
  const { orderId } = Route.useParams()
  return <OrderConfirmationPage orderId={orderId} />
}
