import { createFileRoute } from '@tanstack/react-router'
import { ArticleDetailPage } from '@/pages/learn'

export const Route = createFileRoute('/learn/$slug')({
  component: LearnArticleRoute,
})

function LearnArticleRoute() {
  const { slug } = Route.useParams()
  return <ArticleDetailPage slug={slug} />
}
