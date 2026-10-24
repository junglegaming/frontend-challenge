import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/domains/auth'
import { AdminUsersPage } from '@/pages/admin-users'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin'),
  component: AdminUsersPage,
})
