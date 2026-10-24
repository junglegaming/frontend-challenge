import { createFileRoute } from '@tanstack/react-router'
import { CreatorDetailPage } from '@/pages/creator-detail'

export const Route = createFileRoute('/creators/$creatorId')({
  component: CreatorDetailRoute,
})

function CreatorDetailRoute() {
  const { creatorId } = Route.useParams()
  return <CreatorDetailPage creatorId={creatorId} />
}
