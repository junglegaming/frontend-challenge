import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { adminOrdersSearchSchema } from '@/domains/admin'
import { requireRole } from '@/domains/auth'
import { AdminOrdersPage } from '@/pages/admin-orders'

export const Route = createFileRoute('/admin/orders/')({
  // The filter and the page live in the URL. Anything malformed falls back to the default. The fallback names the keys
  // explicitly (`undefined`): the router merges the validated search over the raw one, so a result without the keys
  // would let a malformed raw value through.
  validateSearch: adminOrdersSearchSchema.catch({ status: undefined, page: undefined }),
  beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin'),
  component: AdminOrdersRoute,
})

function AdminOrdersRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  // The defaults (all statuses, first page) are written as `undefined`, so they never reach the address.
  return <AdminOrdersPage search={search} onSearchChange={(next) => void navigate({ search: { status: next.status, page: next.page } })} />
}
