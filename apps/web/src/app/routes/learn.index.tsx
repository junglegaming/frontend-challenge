import { createFileRoute } from '@tanstack/react-router'
import { LearnPage } from '@/pages/learn'

export const Route = createFileRoute('/learn/')({
  component: LearnPage,
})
