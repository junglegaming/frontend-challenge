import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/domains/auth'
import { AdminProductsPage } from '@/pages/admin-products'

export const Route = createFileRoute('/admin/products')({
  beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin'),
  component: AdminProductsPage,
})
