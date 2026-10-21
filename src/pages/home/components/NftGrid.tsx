import { NftCard, type NftSummary } from '@/domains/catalog'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export function NftGridSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFTs" className="grid grid-cols-2 gap-6 lg:grid-cols-3">
      {Array.from({ length: 9 }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4] w-full" />
      ))}
    </div>
  )
}

export function NftGridEmpty({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <p className="text-title font-bold">Nenhum NFT encontrado</p>
      <p className="max-w-sm text-muted-foreground">Tente ajustar os filtros ou a busca para encontrar mais resultados.</p>
      <Button variant="outline" onClick={onClearFilters}>
        Limpar filtros
      </Button>
    </div>
  )
}

export function NftGridError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <p className="text-title font-bold">Não foi possível carregar o catálogo</p>
      <p className="max-w-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

export function NftGrid({ items }: { items: NftSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
      {items.map((nft) => (
        <NftCard key={nft.id} nft={nft} />
      ))}
    </div>
  )
}
