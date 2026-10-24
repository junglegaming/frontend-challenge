import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ownersSearchSchema, requireCoinsAdmin } from '@/domains/coins-admin'
import { AdminCoinsPage } from '@/pages/admin-coins'

export const Route = createFileRoute('/admin/coins/')({
  // The cursor stack of the owners list lives in the URL. Anything malformed falls back to the first page. The
  // fallback names the key explicitly (`undefined`): the router merges the validated search over the raw one, so a
  // result without the key would let the malformed raw value through.
  validateSearch: ownersSearchSchema.catch({ cursors: undefined }),
  beforeLoad: ({ location }) => requireCoinsAdmin(location.href),
  component: AdminCoinsRoute,
})

function AdminCoinsRoute() {
  const { cursors = [] } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  // The first page keeps a clean address: an empty stack is not written to the URL.
  const onCursorsChange = (next: string[]) => void navigate({ search: { cursors: next.length > 0 ? next : undefined } })
  return <AdminCoinsPage cursors={cursors} onCursorsChange={onCursorsChange} />
}
