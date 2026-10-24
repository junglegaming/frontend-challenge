import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { NftCard } from '@/domains/catalog'
import { creatorQueries } from '@/domains/creators'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'
import { CreatorBio } from './components/CreatorBio'

function CreatorNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <p className="text-title font-bold">Criador não encontrado</p>
      <p className="max-w-sm text-muted-foreground">Verifique o link ou volte para o diretório de criadores.</p>
      <Button asChild>
        <Link to="/creators">Voltar para Criadores</Link>
      </Button>
    </div>
  )
}

export function CreatorDetailPage({ creatorId }: { creatorId: string }) {
  const creator = useQuery(creatorQueries.detail(creatorId))
  const nfts = useQuery({ ...creatorQueries.nfts(creatorId), enabled: creator.isSuccess })

  if (creator.isPending) return <PageContainer className="py-8"><Skeleton className="h-64 w-full" /></PageContainer>

  if (creator.isError) {
    if (isApiError(creator.error) && creator.error.code === 'NOT_FOUND') {
      return (
        <PageContainer className="py-8">
          <CreatorNotFound />
        </PageContainer>
      )
    }
    return (
      <PageContainer className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-title font-bold">Não foi possível carregar este criador</p>
        <Button onClick={() => void creator.refetch()}>Tentar novamente</Button>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex flex-col gap-8 py-8">
      <CreatorBio creator={creator.data} />

      <div>
        <h2 className="mb-4 text-title font-bold">NFTs deste criador</h2>
        {nfts.isPending && (
          <div role="status" aria-label="Carregando NFTs" className="grid grid-cols-2 gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        )}
        {nfts.data && nfts.data.length === 0 && (
          <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-muted-foreground">
            Este criador não tem NFTs listados no momento.
          </p>
        )}
        {nfts.data && nfts.data.length > 0 && (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
            {nfts.data.map((nft) => (
              <NftCard key={nft.id} nft={nft} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
