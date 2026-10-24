import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/domains/auth'
import { AdminDashboardPage } from '@/pages/admin-dashboard'

export const Route = createFileRoute('/admin/')({
  beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin'),
  component: AdminDashboardPage,
})
