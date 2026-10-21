import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/domains/auth'
import { WalletsPage } from '@/pages/wallets'

export const Route = createFileRoute('/account/wallets')({
  beforeLoad: ({ location }) => requireSession(location.href),
  component: WalletsPage,
})
