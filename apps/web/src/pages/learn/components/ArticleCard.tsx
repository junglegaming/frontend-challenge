import { Link } from '@tanstack/react-router'
import type { Article } from '../content/articles'

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to="/learn/$slug"
      params={{ slug: article.slug }}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6 hover:bg-muted focus-visible:outline-3 focus-visible:outline-ring"
    >
      <h2 className="text-title font-bold">{article.title}</h2>
      <p className="text-muted-foreground">{article.summary}</p>
      <p className="text-caption text-muted-foreground">{article.readingMinutes} min de leitura</p>
    </Link>
  )
}
