import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/pages/profile'

export const Route = createFileRoute('/account/profile')({
  component: ProfilePage,
})
