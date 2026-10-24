import { PageContainer } from '@/shared/ui/page-container'
import { ArticleCard } from './components/ArticleCard'
import { ARTICLES } from './content/articles'

export function LearnPage() {
  return (
    <PageContainer className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-title font-bold">Aprenda</h1>
        <p className="text-muted-foreground">Guias curtos sobre NFTs e como aproveitar a Kurio.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {ARTICLES.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </PageContainer>
  )
}
