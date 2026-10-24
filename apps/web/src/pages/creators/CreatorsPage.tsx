import { useQuery } from '@tanstack/react-query'
import { creatorQueries } from '@/domains/creators'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'
import { CreatorCard } from './components/CreatorCard'

export function CreatorsPage() {
  const creators = useQuery(creatorQueries.list())

  return (
    <PageContainer className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-title font-bold">Criadores</h1>
        <p className="text-muted-foreground">Conheça quem está por trás dos NFTs da Kurio.</p>
      </div>

      {creators.isPending && (
        <div role="status" aria-label="Carregando criadores" className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {creators.isError && (
        <div role="alert" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-title font-bold">Não foi possível carregar os criadores</p>
          <p className="max-w-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
          <Button onClick={() => void creators.refetch()}>Tentar novamente</Button>
        </div>
      )}

      {creators.data && creators.data.length === 0 && (
        <p className="rounded-lg border border-border bg-card px-4 py-16 text-center text-muted-foreground">
          Nenhum criador disponível no momento.
        </p>
      )}

      {creators.data && creators.data.length > 0 && (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {creators.data.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
