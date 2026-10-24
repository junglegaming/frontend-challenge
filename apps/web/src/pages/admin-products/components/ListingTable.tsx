import { useState } from 'react'
import { toast } from 'sonner'
import { useAdminNfts, useDelistNft, useUpdateListing } from '@/domains/admin'
import type { Nft } from '@/domains/catalog'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'

function EditionRow({ nft, editionId, price, available }: { nft: Nft; editionId: string; price: string; available: number }) {
  const updateListing = useUpdateListing()
  const [priceValue, setPriceValue] = useState(price)
  const [availableValue, setAvailableValue] = useState(String(available))

  function save() {
    updateListing.mutate(
      { nftId: nft.id, editionId, change: { price: priceValue, available: Number(availableValue) } },
      {
        onSuccess: () => toast.success('Edição atualizada.'),
        onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível atualizar a edição.'),
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border py-2 first:border-t-0">
      <span className="w-32 text-body">{editionId}</span>
      <Input className="w-28" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} aria-label={`Preço de ${editionId}`} />
      <Input
        className="w-24"
        type="number"
        min={0}
        value={availableValue}
        onChange={(e) => setAvailableValue(e.target.value)}
        aria-label={`Estoque de ${editionId}`}
      />
      <Button size="sm" variant="outline" disabled={updateListing.isPending} onClick={save}>
        Salvar
      </Button>
    </div>
  )
}

function ListingRow({ nft }: { nft: Nft }) {
  const delistNft = useDelistNft()

  function delist() {
    delistNft.mutate(nft.id, {
      onSuccess: () => toast.success(`${nft.name} removido da vitrine.`),
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível remover o anúncio.'),
    })
  }

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-foreground">{nft.name}</p>
          <p className="text-caption text-muted-foreground">{nft.collection}</p>
        </div>
        <Button size="sm" variant="outline" disabled={delistNft.isPending} onClick={delist}>
          Remover da vitrine
        </Button>
      </div>
      <div className="mt-2">
        {nft.editions.map((edition) => (
          <EditionRow key={edition.id} nft={nft} editionId={edition.id} price={edition.price} available={edition.available} />
        ))}
      </div>
    </li>
  )
}

export function ListingTable() {
  const nfts = useAdminNfts()

  if (nfts.isPending) return <Skeleton className="h-64 w-full" />

  if (nfts.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-10 text-center">
        <p className="text-muted-foreground">Não foi possível carregar os anúncios.</p>
        <Button onClick={() => void nfts.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  if (nfts.data.length === 0) {
    return <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-muted-foreground">Nenhum anúncio ainda.</p>
  }

  return (
    <ul aria-label="Anúncios do catálogo" className="flex flex-col gap-3">
      {nfts.data.map((nft) => (
        <ListingRow key={nft.id} nft={nft} />
      ))}
    </ul>
  )
}
