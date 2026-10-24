import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { ARTICLES } from './content/articles'

function ArticleNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <p className="text-title font-bold">Artigo não encontrado</p>
      <p className="max-w-sm text-muted-foreground">Verifique o link ou volte para a lista de artigos.</p>
      <Button asChild>
        <Link to="/learn">Voltar para Aprenda</Link>
      </Button>
    </div>
  )
}

export function ArticleDetailPage({ slug }: { slug: string }) {
  const article = ARTICLES.find((a) => a.slug === slug)

  if (!article) {
    return (
      <PageContainer className="py-8">
        <ArticleNotFound />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex max-w-2xl flex-col gap-4 py-8">
      <h1 className="text-title font-bold">{article.title}</h1>
      <p className="text-caption text-muted-foreground">{article.readingMinutes} min de leitura</p>
      {article.body.split('\n\n').map((paragraph, i) => (
        <p key={i} className="text-body text-foreground">
          {paragraph}
        </p>
      ))}
    </PageContainer>
  )
}
