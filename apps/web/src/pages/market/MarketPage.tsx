import { PageContainer } from '@/shared/ui/page-container'
import { CategoryTiles } from './components/CategoryTiles'
import { CollectionsRail } from './components/CollectionsRail'
import { TrendingRail } from './components/TrendingRail'

export function MarketPage() {
  return (
    <PageContainer className="flex flex-col gap-10 py-8">
      <div>
        <h1 className="text-title font-bold">Mercado</h1>
        <p className="text-muted-foreground">Descubra NFTs por categoria, em alta e por coleção.</p>
      </div>

      <CategoryTiles />
      <TrendingRail />
      <CollectionsRail />
    </PageContainer>
  )
}
