import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NETWORK_LABELS } from '@/schemas/common'
import type { Nft } from '@/schemas/nft'
import { NftRating } from './NftRating'

interface NftTabsProps {
  nft: Nft
}

const triggerClass =
  'h-auto flex-none border-0 px-0 pt-0 pb-3 text-sm leading-4 font-bold text-muted-foreground after:bg-primary group-data-horizontal/tabs:after:bottom-0! data-active:text-accent-text'

export function NftTabs({ nft }: NftTabsProps) {
  return (
    <Tabs defaultValue="details" className="mt-16 gap-0 md:mt-24">
      <TabsList
        variant="line"
        aria-label="Informações do NFT"
        className="h-auto w-full flex-wrap justify-start gap-x-8 gap-y-2 border-b border-border p-0"
      >
        <TabsTrigger value="details" className={triggerClass}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className={triggerClass}>
          <span className="sm:hidden">Avaliações ({nft.reviewsCount})</span>
          <span className="hidden sm:inline">Avaliações de colecionadores ({nft.reviewsCount})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="pt-3">
        <p className="text-sm leading-5 text-muted-foreground">{nft.details}</p>
        <dl className="mt-3 flex flex-col gap-3 text-sm leading-6">
          <div>
            <dt className="font-bold">Rede:</dt>
            <dd className="text-muted-foreground">
              Cunhado na {NETWORK_LABELS[nft.network]} com procedência imutável e metadados armazenados no IPFS.
            </dd>
          </div>
          <div>
            <dt className="font-bold">Contrato:</dt>
            <dd className="text-muted-foreground">{nft.contract}</dd>
          </div>
          <div>
            <dt className="font-bold">Direitos autorais:</dt>
            <dd className="text-muted-foreground">{nft.royalty}</dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="pt-3">
        <p className="text-2xl font-bold">{nft.rating.toFixed(1)} de 5</p>
        <NftRating rating={nft.rating} reviewsCount={nft.reviewsCount} className="mt-3" />
        <p className="mt-4 text-sm text-muted-foreground">
          Média de {nft.rating.toFixed(1)} em {nft.reviewsCount} avaliações de colecionadores.
        </p>
      </TabsContent>
    </Tabs>
  )
}
