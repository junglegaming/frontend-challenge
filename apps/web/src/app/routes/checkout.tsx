import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/domains/auth'
import { CheckoutPage } from '@/pages/checkout'

export const Route = createFileRoute('/checkout')({
  beforeLoad: ({ location }) => requireSession(location.href),
  component: CheckoutPage,
})
