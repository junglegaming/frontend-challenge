import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/pages/cart'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})
