import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/domains/auth'
import { AdminOrderPage } from '@/pages/admin-order'

export const Route = createFileRoute('/admin/orders/$orderId')({
  beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin'),
  component: AdminOrderRoute,
})

function AdminOrderRoute() {
  const { orderId } = Route.useParams()
  return <AdminOrderPage orderId={orderId} />
}
