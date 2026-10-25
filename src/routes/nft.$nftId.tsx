import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useLocation } from '@tanstack/react-router'
import { Heart, Loader2, Mail, Star } from 'lucide-react'
import { SocialIcon } from '@/components/layout/SocialIcons'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { ComingSoon } from '@/components/common/ComingSoon'
import { ErrorState, errorMessage } from '@/components/common/ErrorState'
import { EthPrice } from '@/components/common/EthPrice'
import { PageContainer } from '@/components/layout/PageContainer'
import { NftBuyBar } from '@/components/nft/NftBuyBar'
import { NftDetailSkeleton } from '@/components/nft/NftDetailSkeleton'
import { NftEditionSelector } from '@/components/nft/NftEditionSelector'
import { NftGallery } from '@/components/nft/NftGallery'
import { NftMobileHero } from '@/components/nft/NftMobileHero'
import { NftQuantityStepper } from '@/components/nft/NftQuantityStepper'
import { NftRating } from '@/components/nft/NftRating'
import { NftTabs } from '@/components/nft/NftTabs'
import { RelatedNfts } from '@/components/nft/RelatedNfts'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/hooks/useCart'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { useNft } from '@/hooks/useNfts'
import { useSession } from '@/hooks/useSession'
import { compareEth, formatEth } from '@/lib/eth'
import { realtimeEvents } from '@/realtime/events'
import { editionIdSchema, type EditionId, type Nft } from '@/schemas/nft'

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: z.object({ edition: editionIdSchema.optional().catch(undefined) }),
  component: Page,
})

function Page() {
  const { nftId } = Route.useParams()
  const query = useNft(nftId)

  if (query.isPending) {
    return (
      <PageContainer className="px-6 pt-0 md:px-6 md:pt-8 xl:px-0">
        <NftDetailSkeleton />
      </PageContainer>
    )
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.code === 'NOT_FOUND'
    return (
      <PageContainer className="px-6 pt-0 md:px-6 md:pt-8 xl:px-0">
        <div className="hidden md:block">
          <Breadcrumb />
        </div>
        {notFound ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <h1 className="text-2xl font-bold">NFT não encontrado</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Este NFT não existe ou foi removido do mercado.
            </p>
            <Button asChild>
              <Link to="/">Voltar ao catálogo</Link>
            </Button>
          </div>
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
        )}
      </PageContainer>
    )
  }

  return <NftDetail nft={query.data} />
}

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação" className="mb-3 text-sm leading-4">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="hover:text-accent-text">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link to="/" hash="catalogo" className="text-accent-text hover:underline">
            Mercado
          </Link>
        </li>
      </ol>
    </nav>
  )
}

function NftDetail({ nft }: { nft: Nft }) {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { href } = useLocation()
  const { user, isLoading: sessionLoading } = useSession()
  const favorites = useFavorites()
  const favoriteMutation = useToggleFavorite()
  const buy = useAddToCart()
  const [buyError, setBuyError] = useState<string | null>(null)
  const [quantityState, setQuantityState] = useState<{ editionId: EditionId; value: number }>({
    editionId: '1/50',
    value: 1,
  })

  const requestedEdition = nft.editions.find((edition) => edition.id === search.edition)
  const selectedEdition =
    (requestedEdition && requestedEdition.available > 0 ? requestedEdition : undefined) ??
    nft.editions.find((edition) => edition.id === '1/50' && edition.available > 0) ??
    nft.editions.find((edition) => edition.available > 0) ??
    nft.editions[0]

  const rawQuantity = quantityState.editionId === selectedEdition?.id ? quantityState.value : 1
  const maxQuantity = Math.max(1, selectedEdition?.available ?? 0)
  const quantity = Math.min(Math.max(1, rawQuantity), maxQuantity)
  const soldOut = !selectedEdition || selectedEdition.available === 0
  const [priceChange, setPriceChange] = useState<{ editionId: EditionId; price: string } | null>(null)
  const lastPriceRef = useRef<{ editionId: EditionId; price: string } | null>(null)

  const previousPrice =
    selectedEdition &&
    priceChange?.editionId === selectedEdition.id &&
    compareEth(priceChange.price, selectedEdition.price) !== 0
      ? priceChange.price
      : null

  useEffect(() => {
    lastPriceRef.current = selectedEdition
      ? { editionId: selectedEdition.id, price: selectedEdition.price }
      : null
  }, [selectedEdition])

  useEffect(() => {
    const editionId = selectedEdition?.id
    if (!editionId) return
    return realtimeEvents.on('nft.updated', (event) => {
      if (event.resource.id !== nft.id) return
      const known = lastPriceRef.current
      if (!known || known.editionId !== editionId) return
      const updated = event.data.editions.find((edition) => edition.id === editionId)
      if (!updated || compareEth(updated.price, known.price) === 0) return
      setPriceChange({ editionId, price: known.price })
    })
  }, [nft.id, selectedEdition?.id])

  useEffect(() => {
    if (!selectedEdition || search.edition === selectedEdition.id) return
    void navigate({
      search: (prev) => ({ ...prev, edition: selectedEdition.id }),
      replace: true,
    })
  }, [navigate, search.edition, selectedEdition])

  const selectEdition = (edition: EditionId) => {
    setBuyError(null)
    setPriceChange(null)
    void navigate({ search: (prev) => ({ ...prev, edition }), replace: true })
  }

  const favorite = favorites.isFavorite(nft.id)
  const favoritePending = favoriteMutation.isPending
  const favoriteDisabled = sessionLoading || favoritePending

  const toggleFavorite = () => {
    if (sessionLoading) return
    if (!user) {
      void navigate({ to: '/login', search: { redirect: href } })
      return
    }
    favoriteMutation.mutate({ nftId: nft.id, favorite: !favorite })
  }

  const buyNow = () => {
    if (!selectedEdition || soldOut || buy.isPending) return
    setBuyError(null)
    buy.mutate(
      { nftId: nft.id, editionId: selectedEdition.id, quantity },
      {
        onSuccess: () => {
          toast.success('NFT adicionado ao carrinho')
          void navigate({ to: '/cart' })
        },
        onError: (error) => {
          setBuyError(error instanceof ApiError && error.code === 'OUT_OF_STOCK' ? error.message : errorMessage(error))
        },
      },
    )
  }

  if (!selectedEdition) {
    return (
      <PageContainer className="px-6 pt-0 md:px-6 md:pt-8 xl:px-0">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Edições indisponíveis</h1>
          <p className="text-sm text-muted-foreground">Este NFT não possui edições para compra no momento.</p>
          <Button asChild>
            <Link to="/">Voltar ao catálogo</Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <div className="pb-[180px] md:pb-0">
      <PageContainer className="px-6 pt-0 md:px-6 md:pt-8 xl:px-0">
        <div className="hidden md:block">
          <Breadcrumb />
        </div>

        <NftMobileHero
          nft={nft}
          favorite={favorite}
          favoritePending={favoritePending}
          favoriteDisabled={favoriteDisabled}
          onToggleFavorite={toggleFavorite}
        />

        <div className="relative z-10 -mx-6 -mt-[114px] rounded-t-[32px] bg-card px-6 pt-8 pb-8 md:hidden">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl leading-7 font-bold">{nft.name}</h1>
            <span
              role="img"
              className="inline-flex h-[27px] shrink-0 items-center gap-0.5 rounded-full border border-primary px-2 text-xs font-bold text-accent-text"
              aria-label={`Avaliação ${nft.rating.toFixed(1)} de 5, ${nft.reviewsCount} avaliações`}
            >
              <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
              {nft.rating.toFixed(1)} <span className="text-muted-foreground">({nft.reviewsCount})</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{nft.description}</p>
          <div className="mt-3">
            <NftEditionSelector editions={nft.editions} value={selectedEdition.id} onChange={selectEdition} />
          </div>
          <dl className="mt-3 flex flex-col gap-3 text-sm leading-5 text-subtle">
            <div className="flex gap-1">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Coleção:</dt>
              <dd>{nft.collectionName}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>
        </div>

        <div className="hidden items-start md:grid md:grid-cols-[573fr_595fr] md:gap-8">
          <NftGallery nft={nft} />

          <div className="hidden flex-col gap-3 md:flex">
            <div className="border-b border-border pb-3">
              <h1 className="text-2xl leading-[37px] font-bold">{nft.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <EthPrice value={selectedEdition.price} previous={previousPrice} className="text-lg leading-5" />
                <NftRating rating={nft.rating} reviewsCount={nft.reviewsCount} className="ml-auto" />
              </div>
            </div>

            <div>
              <h2 className="text-sm leading-4 font-bold">Sobre este NFT:</h2>
              <p className="mt-3 text-sm leading-[22px] text-muted-foreground">{nft.description}</p>
            </div>

            <NftEditionSelector editions={nft.editions} value={selectedEdition.id} onChange={selectEdition} />

            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <NftQuantityStepper
                quantity={quantity}
                max={selectedEdition.available}
                onChange={(value) => setQuantityState({ editionId: selectedEdition.id, value })}
                disabled={buy.isPending || soldOut}
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={buyNow} disabled={soldOut || buy.isPending} className="md:w-[130px]">
                  {soldOut ? 'ESGOTADO' : buy.isPending ? 'ADICIONANDO…' : 'COMPRAR'}
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleFavorite}
                  disabled={favoriteDisabled}
                  aria-pressed={favorite}
                  aria-busy={favoritePending}
                  className="px-2 text-primary md:w-[130px]"
                >
                  {favoritePending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Heart className={favorite ? 'fill-primary' : undefined} aria-hidden="true" />
                  )}
                  {favoritePending ? 'Salvando…' : favorite ? 'Favoritado' : 'Favoritar'}
                </Button>
              </div>
            </div>

            {buyError && (
              <p role="alert" className="text-sm text-destructive">
                {buyError}
              </p>
            )}

            <p className="sr-only" aria-live="polite">
              {previousPrice ? `Preço atualizado para ${formatEth(selectedEdition.price)}.` : ''}
            </p>

            <dl className="flex flex-col gap-3 text-sm leading-5 text-subtle">
              <div className="flex gap-1">
                <dt>ID do token:</dt>
                <dd>{nft.tokenId}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Coleção:</dt>
                <dd>{nft.collectionName}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Atributos:</dt>
                <dd>{nft.attributes.join(', ')}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2 text-sm leading-5">
              <span className="font-bold">Compartilhar este NFT:</span>
              <span className="flex items-center gap-2 text-foreground">
                <ComingSoon className="opacity-100">
                  <SocialIcon network="linkedin" />
                </ComingSoon>
                <ComingSoon className="opacity-100">
                  <Mail className="size-4" aria-hidden="true" />
                </ComingSoon>
                <ComingSoon className="opacity-100">
                  <SocialIcon network="x" />
                </ComingSoon>
              </span>
            </div>
          </div>
        </div>

        <NftTabs nft={nft} />

        <RelatedNfts collection={nft.collection} currentNftId={nft.id} />
      </PageContainer>

      <NftBuyBar
        price={selectedEdition.price}
        quantity={quantity}
        max={selectedEdition.available}
        onQuantityChange={(value) => setQuantityState({ editionId: selectedEdition.id, value })}
        onBuy={buyNow}
        isPending={buy.isPending}
        error={buyError}
      />
    </div>
  )
}
