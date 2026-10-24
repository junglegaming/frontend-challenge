import { createFileRoute } from '@tanstack/react-router'
import { CreatorsPage } from '@/pages/creators'

export const Route = createFileRoute('/creators/')({
  component: CreatorsPage,
})
