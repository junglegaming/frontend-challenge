import { useMemo, useState } from 'react'
import type { Nft, NftEdition } from '@/domains/catalog'
import { eth } from '@/shared/lib/eth'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Breadcrumb } from './Breadcrumb'
import { EditionPicker } from './EditionPicker'
import { Gallery } from './Gallery'
import { PurchaseActions } from './PurchaseActions'
import { QuantityStepper } from './QuantityStepper'

const firstSelectable = (editions: NftEdition[]) => editions.find((e) => e.status === 'available') ?? editions[0]

export function NftDetailView({ nft }: { nft: Nft }) {
  const [selectedEditionId, setSelectedEditionId] = useState(() => firstSelectable(nft.editions)?.id ?? '')
  const [requestedQuantity, setRequestedQuantity] = useState(1)

  // Derived, not stored: if the selected edition sold out under the user (realtime update),
  // this falls back to another purchasable edition on the very next render — no effect needed.
  const selectedEdition = useMemo(() => {
    const current = nft.editions.find((e) => e.id === selectedEditionId)
    return current?.status === 'available' ? current : (firstSelectable(nft.editions) ?? nft.editions[0])
  }, [nft.editions, selectedEditionId])

  if (!selectedEdition) return null

  const maxQuantity = Math.max(1, Math.min(selectedEdition.available, selectedEdition.maxPerOrder))
  // Clamped on read, not written back to state: if stock shrinks the display adjusts immediately
  // and grows back correctly if stock is released, without an effect racing the next render.
  const quantity = Math.min(requestedQuantity, maxQuantity)
  const purchasable = selectedEdition.status === 'available' && selectedEdition.available > 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb category={nft.category} name={nft.name} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <Gallery images={nft.gallery} />

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{nft.collection}</Badge>
              {nft.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{nft.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <img src={nft.artist.avatarUrl} alt="" className="size-6 rounded-full" />
              <span>Por {nft.artist.name}</span>
            </div>
          </div>

          <p aria-live="polite" className="text-2xl font-semibold text-foreground">
            {eth.format(selectedEdition.price)}
          </p>

          <p className="text-muted-foreground">{nft.description}</p>

          <Separator />

          <EditionPicker editions={nft.editions} selectedId={selectedEdition.id} onSelect={setSelectedEditionId} />

          <div>
            <h2 className="text-sm font-semibold text-foreground">Quantidade</h2>
            <div className="mt-2">
              <QuantityStepper value={quantity} max={maxQuantity} onChange={setRequestedQuantity} />
            </div>
            {!purchasable && (
              <output className="mt-2 block text-sm text-destructive">
                Esta edição não está disponível no momento.
              </output>
            )}
          </div>

          <PurchaseActions
            nftId={nft.id}
            editionId={selectedEdition.id}
            nftName={nft.name}
            quantity={quantity}
            disabled={!purchasable}
          />
        </div>
      </div>

      <Tabs defaultValue="details" className="mt-12">
        <TabsList>
          <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="max-w-3xl text-muted-foreground">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground">Coleção</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Disponibilidade total</dt>
              <dd>{nft.totalAvailable} unidade(s)</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-foreground">Sobre esta obra</dt>
              <dd>{nft.description}</dd>
            </div>
          </dl>
        </TabsContent>
      </Tabs>
    </div>
  )
}
