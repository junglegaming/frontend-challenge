import { createFileRoute } from '@tanstack/react-router'
import { MarketPage } from '@/pages/market'

export const Route = createFileRoute('/market')({
  component: MarketPage,
})
