import { createFileRoute } from '@tanstack/react-router'
import { requireCoinsAdmin } from '@/domains/coins-admin'
import { AdminCoinsOwnerPage } from '@/pages/admin-coins-owner'

export const Route = createFileRoute('/admin/coins/$ownerId')({
  beforeLoad: ({ location }) => requireCoinsAdmin(location.href),
  component: AdminCoinsOwnerRoute,
})

function AdminCoinsOwnerRoute() {
  const { ownerId } = Route.useParams()
  return <AdminCoinsOwnerPage ownerId={ownerId} />
}
