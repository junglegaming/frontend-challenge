import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { hasCoinsAdminSession } from '@/domains/coins-admin'
import { AdminCoinsLoginPage } from '@/pages/admin-coins-login'

const searchSchema = z.object({
  redirect: z.string().optional(),
  reason: z.literal('expired').optional(),
})

export const Route = createFileRoute('/admin/coins/login')({
  validateSearch: searchSchema,
  // Already signed in: no point in showing the form again.
  beforeLoad: () => {
    if (hasCoinsAdminSession()) throw redirect({ to: '/admin/coins' })
  },
  component: AdminCoinsLoginRoute,
})

function AdminCoinsLoginRoute() {
  const { redirect: redirectTo, reason } = Route.useSearch()
  return <AdminCoinsLoginPage redirect={redirectTo} reason={reason} />
}
