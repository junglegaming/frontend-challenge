import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import Big from 'big.js'
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Linkedin,
  Mail,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Twitter,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAddToCart } from '@/features/cart/api'
import { nftQueryOptions, nftReviewsQueryOptions, nftsQueryOptions } from '@/features/catalog/api'
import { StarRating } from '@/features/catalog/components/StarRating'
import { formatTokenId } from '@/features/checkout/format'
import { favoritesQueryOptions } from '@/features/favorites/api'
import { useFavoriteToggle } from '@/features/favorites/use-favorite-toggle'
import { ApiError } from '@/shared/api/http-client'
import { NftDetailSkeleton } from '@/shared/components/skeletons/NftDetailSkeleton'
import { DEFAULT_NFT_LIST_QUERY, type Edition } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/lib/money'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPage,
})

/** Faixas em ordem de escassez: 1/1, 1/10, 1/50… e a edição aberta por último. */
function byScarcity(a: Edition, b: Edition): number {
  return (a.totalSupply ?? Number.POSITIVE_INFINITY) - (b.totalSupply ?? Number.POSITIVE_INFINITY)
}

const reviewDateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Quantos relacionados mostrar por página (linha de 5 cards do Figma). */
const RELATED_COUNT = 5

/** Páginas do carrossel de relacionados (3 bolinhas do Figma). */
const RELATED_PAGES = 3

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const navigate = Route.useNavigate()
  const nftQuery = useQuery(nftQueryOptions(nftId))
  const favorites = useQuery(favoritesQueryOptions())
  const { toggleFavorite } = useFavoriteToggle()
  const addToCart = useAddToCart()
  const reviewsQuery = useQuery(nftReviewsQueryOptions(nftId))
  const collection = nftQuery.data?.collection
  const relatedQuery = useQuery({
    ...nftsQueryOptions({
      ...DEFAULT_NFT_LIST_QUERY,
      collection,
      // +1 porque o próprio NFT é removido da lista abaixo.
      pageSize: RELATED_COUNT * RELATED_PAGES + 1,
    }),
    enabled: Boolean(collection),
  })

  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null)
  const [selectedThumbnailIdx, setSelectedThumbnailIdx] = useState<number>(1)
  const [quantity, setQuantity] = useState(1)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [activeDot, setActiveDot] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)

  if (nftQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 xl:px-0">
        <NftDetailSkeleton />
      </div>
    )
  }

  if (nftQuery.isError || !nftQuery.data) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 text-center sm:px-6 xl:px-0">
        <h1 className="font-mono text-2xl font-bold text-foreground">NFT não encontrado</h1>
        <p className="mt-2 font-mono text-sm text-text-secondary">
          O NFT que você procura não existe ou foi removido.
        </p>
        <Link
          to="/"
          search={DEFAULT_NFT_LIST_QUERY}
          className="mt-6 inline-flex rounded-[6px] bg-primary px-4 py-2 font-mono text-sm font-bold text-ink transition-colors hover:bg-highlight"
        >
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const nft = nftQuery.data
  const mainArtworkUrl = nft.imageUrl
  const editions = [...nft.editions].sort(byScarcity)
  // Padrão: a edição principal do NFT, se houver estoque; senão a primeira disponível.
  const edition =
    nft.editions.find((item) => item.id === selectedEditionId) ??
    nft.editions.find((item) => item.available > 0) ??
    nft.editions[0]
  const available = edition?.available ?? 0
  const isSoldOut = available === 0
  const maxQuantity = Math.max(1, available)
  const isFavorite = favorites.data?.items.some((item) => item.nftId === nft.id) ?? false
  const reviews = reviewsQuery.data
  const ratingAverage = reviews ? Number(reviews.average) : null
  const relatedPool = (relatedQuery.data?.items ?? []).filter((item) => item.id !== nft.id)
  const relatedPageCount = Math.max(1, Math.ceil(relatedPool.length / RELATED_COUNT))
  const activeRelatedPage = Math.min(activeDot, relatedPageCount - 1)
  const related = relatedPool.slice(
    activeRelatedPage * RELATED_COUNT,
    (activeRelatedPage + 1) * RELATED_COUNT,
  )

  // 4 thumbnails of the artwork; thumbnail index 1 is active by default (matching Figma)
  const thumbnails = [mainArtworkUrl, mainArtworkUrl, mainArtworkUrl, mainArtworkUrl]

  function selectEdition(editionId: string) {
    setSelectedEditionId(editionId)
    setQuantity(1)
  }

  /** Adiciona a edição e a quantidade escolhidas, com retorno acessível (toast). */
  function addSelectedToCart(goToCart: boolean) {
    if (!edition || isSoldOut) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          if (goToCart) void navigate({ to: '/carrinho' })
          else toast.success(`${nft.name} (${edition.name}) adicionado ao carrinho.`)
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível adicionar ao carrinho. Tente novamente.',
          )
        },
      },
    )
  }

  function handleToggleFavorite() {
    toggleFavorite(nft.id, !isFavorite)
  }

  function handleShare(platform: 'linkedin' | 'email' | 'twitter') {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://kurio.art'
    const shareText = `Confira a obra ${nft.name} da coleção ${nft.collection} no Kurio!`

    if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer',
      )
    } else if (platform === 'linkedin') {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer',
      )
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(nft.name + ' no Kurio')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
    }
  }

  return (
    <>
      {/* Mobile / Detalhes do NFT (Figma 414px x 896px) */}
      <div className="relative flex h-full min-h-[100dvh] max-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#140D0A] md:hidden">
        {/* Hero Artwork Section */}
        <div
          className="relative flex flex-1 min-h-0 w-full flex-col justify-between p-4 pb-2"
          style={{
            background: 'linear-gradient(143.28deg, #241612 -12%, #2F1D15 106.59%)',
          }}
        >
          {/* Top Actions: Back Button (Left) + Favorite Button (Right) */}
          <div className="z-10 flex shrink-0 w-full items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back()
                } else {
                  navigate({ to: '/', search: DEFAULT_NFT_LIST_QUERY })
                }
              }}
              aria-label="Voltar"
              className="flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-[#CFB28C] shadow-sm transition-transform active:scale-95"
            >
              <ArrowLeft className="size-5" />
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className="flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] shadow-sm transition-transform active:scale-95"
            >
              <Heart
                aria-hidden="true"
                className={cn(
                  'size-4 transition-colors',
                  isFavorite ? 'fill-[#E89B55] text-[#E89B55]' : 'fill-transparent text-[#E89B55]',
                )}
              />
            </button>
          </div>

          {/* Main Hero Artwork */}
          <div className="my-auto flex flex-1 min-h-0 w-full items-center justify-center py-1">
            <img
              src={mainArtworkUrl}
              alt={nft.name}
              // Reserva o quadrado final antes do download (evita layout shift).
              width={320}
              height={320}
              fetchPriority="high"
              className="max-h-full max-w-[280px] sm:max-w-[320px] aspect-square cursor-zoom-in rounded-[24px] border border-[#D28A4C]/15 object-cover shadow-2xl"
              onClick={() => setIsZoomOpen(true)}
            />
          </div>

          {/* Group 62: Carousel indicator (pill + dots) */}
          <div className="flex shrink-0 items-center justify-center gap-1.5 py-1">
            <span className="h-[7px] w-[28px] rounded-[25px] bg-[#D28A4C]" />
            <span className="size-[7px] rounded-full bg-[#D28A4C]" />
            <span className="size-[7px] rounded-full bg-[#D28A4C]" />
          </div>
        </div>

        {/* Details Sheet */}
        <div className="relative z-10 flex shrink-0 w-full flex-col gap-3 rounded-t-[31px] bg-[#241612] px-6 pt-4 pb-3 shadow-xl">
          {/* Title Row: Name + Rating Badge */}
          <div className="flex items-center justify-between gap-2">
            <h1 className="truncate font-mono text-[19px] font-bold leading-5 text-[#F5F1EB]">
              {nft.name}
            </h1>

            {/* Rating badge (Rectangle 99 + Group 63) */}
            {reviews && (
              <div
                role="img"
                aria-label={`Avaliação ${reviews.average} de 5, ${reviews.count} avaliações`}
                className="flex h-[26px] shrink-0 items-center gap-1.5 rounded-[32px] border border-[#D28A4C] px-2.5"
              >
                <Star aria-hidden="true" className="size-3.5 fill-amber text-amber" />
                <span className="font-mono text-[13px] font-medium leading-4 text-[#F5F1EB]">
                  {reviews.average}
                </span>
                <span className="font-mono text-[13px] font-normal leading-4 text-[#CFB28C]">
                  ({reviews.count})
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="line-clamp-2 font-mono text-[13px] font-normal leading-5 text-[#CFB28C]">
            {nft.description}
          </p>

          {/* Frame 66: Edition selector */}
          <div className="flex flex-col gap-1.5">
            <span
              id="mobile-edition-label"
              className="font-mono text-[14px] font-bold leading-4 text-[#F5F1EB]"
            >
              Edição:
            </span>
            <div
              role="group"
              aria-labelledby="mobile-edition-label"
              className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none"
            >
              {editions.map((item) => {
                const isSelected = edition?.id === item.id
                const isUnavailable = item.available === 0
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isUnavailable}
                    aria-label={isUnavailable ? `${item.name} (esgotada)` : item.name}
                    onClick={() => selectEdition(item.id)}
                    className={cn(
                      'cursor-pointer rounded-full px-3 py-0.5 font-mono text-[13px] transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50',
                      isSelected
                        ? 'border border-[#D28A4C] font-medium text-[#E89B55]'
                        : 'border border-[#3F2319] font-normal text-[#CFB28C] hover:border-[#D28A4C]/50',
                    )}
                  >
                    {item.name}
                  </button>
                )
              })}
            </div>
            <p className="font-mono text-[12px] leading-4 text-[#B39463]">
              {isSoldOut ? 'Edição esgotada.' : `${available} disponível(is) nesta edição.`}
            </p>
          </div>

          {/* Token Info */}
          <div className="flex flex-col gap-1 font-mono text-[13px] leading-4 text-[#B39463]">
            <p>ID do token: {formatTokenId(nft.id)}</p>
            <p>Coleção: {nft.collection}</p>
            <p>Atributos: {nft.attributes.join(', ')}</p>
          </div>
        </div>

        {/* Buy Bar (Docked at Bottom) */}
        <div className="relative z-20 shrink-0 w-full border-t border-[#3F2319]/50 bg-[#241612] px-6 pt-3 pb-6 shadow-[0px_-4px_20px_rgba(10,6,4,0.45)]">
          <div className="mx-auto flex max-w-[366px] flex-col gap-3">
            {/* Top Row: Quantity + Price */}
            <div className="flex items-center justify-between">
              {/* Quantity */}
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[14px] font-medium text-[#CFB28C]">Qtd.</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isSoldOut}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Diminuir quantidade"
                    className="flex h-[28px] w-[24px] cursor-pointer items-center justify-center rounded-[20px] border border-[#140D0A] bg-[#D28A4C] text-black shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="size-3.5 text-black" strokeWidth={3} />
                  </button>
                  <span className="min-w-4 text-center font-mono text-[16px] font-medium text-[#F5F1EB]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxQuantity || isSoldOut}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    aria-label="Aumentar quantidade"
                    className="flex h-[28px] w-[24px] cursor-pointer items-center justify-center rounded-[20px] border border-[#140D0A] bg-[#D28A4C] text-black shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-3.5 text-black" strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="font-mono text-[18px] font-bold text-[#E89B55]">
                {formatEth(Big(nft.priceEth).times(quantity).toString())} ETH
              </div>
            </div>

            {/* Bottom Row: Buy Button + Cart Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSoldOut}
                onClick={() => addSelectedToCart(true)}
                className="flex h-[52px] flex-1 cursor-pointer items-center justify-center rounded-[40px] font-mono text-[16px] font-bold text-[#140D0A] shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background:
                    'linear-gradient(93.21deg, #D28A4C -3.96%, rgba(210, 138, 76, 0.8) 121.97%)',
                }}
              >
                {isSoldOut ? 'Esgotado' : 'Comprar NFT'}
              </button>

              <button
                type="button"
                disabled={isSoldOut}
                onClick={() => addSelectedToCart(false)}
                aria-label="Adicionar ao carrinho"
                className="flex size-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[40px] border border-[#3F2319] bg-[#2F1D15] text-[#B39463] shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop / Detalhes do NFT */}
      <div className="mx-auto hidden w-full max-w-[1248px] flex-col gap-[96px] px-4 py-6 sm:px-6 md:flex">
        {/* Top Section (Breadcrumb + Product Images & Details) */}
        <section aria-label="Detalhes principais do produto" className="flex w-full flex-col gap-8">
          {/* Breadcrumb: Início / Mercado */}
          <nav
            aria-label="Breadcrumb"
            className="flex h-4 items-center gap-2 font-mono text-[15px] leading-4 font-bold text-[#F5F1EB]"
          >
            <Link
              to="/"
              search={DEFAULT_NFT_LIST_QUERY}
              className="transition-colors hover:text-primary"
            >
              Início
            </Link>
            <span className="text-[#F5F1EB]">/</span>
            <Link
              to="/"
              search={DEFAULT_NFT_LIST_QUERY}
              className="transition-colors hover:text-primary"
            >
              Mercado
            </Link>
          </nav>

          {/* Product: Left (Images) + Right (Details) */}
          <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
            {/* Product Images: Thumbnails (100px) + Main Image (444px) = 573px */}
            <div className="flex w-full flex-col-reverse gap-4 sm:flex-row sm:items-center sm:gap-7 lg:w-[573px] lg:shrink-0">
              {/* Thumbnails (100px wide, gap 16px) */}
              <div className="flex gap-4 sm:flex-col sm:gap-4">
                {thumbnails.map((imgSrc, idx) => {
                  const active = selectedThumbnailIdx === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedThumbnailIdx(idx)}
                      aria-label={`Visualizar miniatura ${idx + 1}`}
                      className={cn(
                        'size-[100px] shrink-0 cursor-pointer overflow-hidden rounded-[8px] bg-[#241612] transition-all',
                        active
                          ? 'border border-primary'
                          : 'border border-transparent hover:border-primary/50',
                      )}
                    >
                      <img src={imgSrc} alt="" className="size-full rounded-[8px] object-cover" />
                    </button>
                  )
                })}
              </div>

              {/* Main Image Box: 444px x 444px, bg #241612, inner image 404px x 404px rounded-[24px] */}
              <div className="relative flex size-full max-w-[444px] items-center justify-center rounded-[6px] bg-[#241612] p-4 sm:size-[444px]">
                <img
                  src={mainArtworkUrl}
                  alt={`Arte digital de ${nft.name}`}
                  fetchPriority="high"
                  className="size-[404px] max-h-full max-w-full rounded-[24px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  aria-label="Ampliar imagem da arte"
                  title="Ampliar arte"
                  className="absolute top-[15px] right-[15px] flex size-[30px] cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-[#F5F1EB] transition-colors hover:border-primary hover:text-highlight"
                >
                  <Search aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>

            {/* Details Column: 595px x 448px, justify-between */}
            <div className="flex flex-1 flex-col justify-between gap-5 lg:min-h-[448px] lg:w-[595px]">
              {/* Title & Price / Star Rating */}
              <div className="flex flex-col gap-3">
                <h1 className="font-mono text-[28px] leading-[37px] font-bold text-[#F5F1EB]">
                  {nft.name}
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="font-mono text-[22px] leading-4 font-bold text-[#E89B55]">
                    {formatEth(nft.priceEth)} ETH
                  </span>

                  {reviews && ratingAverage !== null && (
                    <div className="flex items-center gap-1.5 font-mono text-[15px] leading-5 text-[#F5F1EB]">
                      <StarRating rating={ratingAverage} />
                      <span>{reviews.count} avaliações de colecionadores</span>
                    </div>
                  )}
                </div>

                {/* Thin hairline divider: border 0.3px solid #D28A4C */}
                <div className="w-full border-b border-[#D28A4C]/30 pt-1" />
              </div>

              {/* Sobre este NFT: */}
              <div className="flex flex-col gap-3">
                <h2 className="font-mono text-[15px] leading-4 font-bold text-[#F5F1EB]">
                  Sobre este NFT:
                </h2>
                <p className="font-mono text-[14px] leading-6 font-normal text-[#CFB28C]">
                  {nft.description}
                </p>
              </div>

              {/* Edição: */}
              <div className="flex flex-col gap-3">
                <span
                  id="desktop-edition-label"
                  className="font-mono text-[15px] leading-4 font-bold text-[#F5F1EB]"
                >
                  Edição:
                </span>
                <div
                  role="group"
                  aria-labelledby="desktop-edition-label"
                  className="flex flex-wrap items-center gap-[6px]"
                >
                  {editions.map((item) => {
                    const active = edition?.id === item.id
                    const isUnavailable = item.available === 0
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        disabled={isUnavailable}
                        aria-label={isUnavailable ? `${item.name} (esgotada)` : item.name}
                        title={isUnavailable ? 'Edição esgotada' : undefined}
                        onClick={() => selectEdition(item.id)}
                        className={cn(
                          'flex h-[28px] min-w-[36px] cursor-pointer items-center justify-center rounded-full px-2 font-mono text-[14px] leading-4 transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50',
                          active
                            ? 'border border-primary font-medium text-[#E89B55]'
                            : 'border border-[#3F2319] font-normal text-[#CFB28C] hover:border-primary/50',
                        )}
                      >
                        {item.name}
                      </button>
                    )
                  })}
                </div>
                <p aria-live="polite" className="font-mono text-[13px] leading-4 text-[#B39463]">
                  {isSoldOut
                    ? 'Edição esgotada: escolha outra edição.'
                    : `${available} disponível(is) nesta edição. Máximo por compra: ${maxQuantity}.`}
                </p>
              </div>

              {/* Stepper + CTA Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                {/* Stepper: Minus (33x49.5 pill) + Quantity + Plus (33x49.5 pill) */}
                <div className="flex h-[49.5px] items-center gap-3">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="flex h-[49.5px] w-[33px] cursor-pointer items-center justify-center rounded-[33px] border border-[#140D0A] bg-primary text-[#000000] shadow-[0px_6.6px_19.8px_-3.3px_rgba(20,13,10,0.15)] transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus aria-hidden="true" className="size-4 stroke-[2.5]" />
                  </button>
                  <span className="min-w-[13px] text-center font-mono text-[20px] leading-7 font-normal text-[#F5F1EB]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    disabled={quantity >= maxQuantity || isSoldOut}
                    onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                    className="flex h-[49.5px] w-[33px] cursor-pointer items-center justify-center rounded-[33px] border border-[#140D0A] bg-primary text-[#000000] shadow-[0px_6.6px_19.8px_-3.3px_rgba(20,13,10,0.15)] transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus aria-hidden="true" className="size-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Action Buttons: COMPRAR (130x40) + Favoritar/Desfavoritar (130x40) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSoldOut || !edition || addToCart.isPending}
                    onClick={() => addSelectedToCart(true)}
                    className="flex h-[40px] w-[130px] cursor-pointer items-center justify-center rounded-[6px] bg-primary font-mono text-[14px] leading-5 font-bold text-[#140D0A] transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    COMPRAR
                  </button>

                  <button
                    type="button"
                    aria-pressed={isFavorite}
                    aria-label={
                      isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`
                    }
                    onClick={handleToggleFavorite}
                    className={cn(
                      'flex h-[40px] w-[130px] cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-primary font-mono text-[14px] leading-5 font-medium transition-colors',
                      isFavorite
                        ? 'bg-primary/15 text-highlight'
                        : 'text-highlight hover:bg-primary/10',
                    )}
                  >
                    <Heart
                      aria-hidden="true"
                      className={cn(
                        'size-5 transition-transform active:scale-125',
                        isFavorite ? 'fill-primary text-primary' : 'text-primary',
                      )}
                    />
                    <span>{isFavorite ? 'Desfavoritar' : 'Favoritar'}</span>
                  </button>
                </div>
              </div>

              {/* Token Metadata & Social Share */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col gap-3 font-mono text-[15px] leading-5 text-[#B39463]">
                  <p>ID do token: {formatTokenId(nft.id)}</p>
                  <p>Coleção: {nft.collection}</p>
                  <p>Atributos: {nft.attributes.join(', ')}</p>
                </div>

                <div className="flex items-center gap-2 pt-1 font-mono text-[15px] text-[#F5F1EB]">
                  <span className="font-bold">Compartilhar este NFT:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShare('linkedin')}
                      aria-label="Compartilhar no LinkedIn"
                      className="p-1 text-[#F5F1EB] transition-colors hover:text-primary"
                    >
                      <Linkedin aria-hidden="true" className="size-[15px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare('email')}
                      aria-label="Compartilhar por E-mail"
                      className="p-1 text-[#F5F1EB] transition-colors hover:text-primary"
                    >
                      <Mail aria-hidden="true" className="size-[18px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShare('twitter')}
                      aria-label="Compartilhar no Twitter"
                      className="p-1 text-[#F5F1EB] transition-colors hover:text-primary"
                    >
                      <Twitter aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard?.writeText(window.location.href)
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2000)
                        }
                      }}
                      aria-label="Copiar link"
                      title={copiedLink ? 'Link copiado!' : 'Copiar link'}
                      className="p-1 text-[#F5F1EB] transition-colors hover:text-primary"
                    >
                      {copiedLink ? (
                        <Check aria-hidden="true" className="size-4 text-emerald-400" />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Description Section with Tabs (Detalhes do NFT / Avaliações) */}
        <section aria-labelledby="details-heading" className="flex w-full flex-col gap-6">
          <h2 id="details-heading" className="sr-only">
            Detalhes e avaliações do NFT
          </h2>

          <Tabs defaultValue="detalhes">
            <TabsList aria-label="Informações do NFT">
              <TabsTrigger value="detalhes">Detalhes do NFT</TabsTrigger>
              <TabsTrigger value="avaliacoes">
                Avaliações de colecionadores{reviews ? ` (${reviews.count})` : ''}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes">
              <div className="flex flex-col gap-6 font-mono text-[14px] leading-6 text-[#CFB28C]">
                <p>
                  {nft.name} é uma obra digital da coleção {nft.collection}. Cada atributo fica
                  armazenado nos metadados do token e verificado na {nft.network}.
                </p>

                <div className="flex flex-col gap-3 font-mono text-[14px] leading-6">
                  <div>
                    <p className="font-bold text-[#F5F1EB]">Rede:</p>
                    <p className="text-[#CFB28C]">
                      Cunhado na {nft.network} com procedência imutável e metadados armazenados no
                      IPFS.
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-[#F5F1EB]">Contrato:</p>
                    <p className="text-[#CFB28C]">
                      {nft.contractAddress} • Contrato inteligente ERC-721 (simulado).
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-[#F5F1EB]">Criador:</p>
                    <p className="text-[#CFB28C]">
                      {nft.creator.name} ({nft.creator.address})
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avaliacoes">
              {reviewsQuery.isError ? (
                <p role="alert" className="font-mono text-sm text-coral">
                  Não foi possível carregar as avaliações.
                </p>
              ) : !reviews || ratingAverage === null ? (
                <p className="font-mono text-sm text-text-secondary">Carregando avaliações…</p>
              ) : (
                <div className="flex flex-col gap-4 font-mono">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="text-[20px] font-bold text-[#E89B55]">
                      {reviews.average} / 5.0
                    </span>
                    <StarRating rating={ratingAverage} starClassName="size-4" />
                    <span className="text-sm text-text-secondary">
                      Baseado em {reviews.count} avaliações · mais recentes abaixo
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviews.items.map((review) => (
                      <li
                        key={review.id}
                        className="flex flex-col gap-2 rounded-[8px] border border-[#3F2319] bg-[#241612] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-bold text-[#F5F1EB]">
                            {review.author}
                          </span>
                          <time dateTime={review.createdAt} className="text-xs text-[#CFB28C]">
                            {reviewDateFormat.format(new Date(review.createdAt))}
                          </time>
                        </div>
                        <StarRating rating={review.rating} starClassName="size-3.5" />
                        <p className="text-[14px] leading-6 text-[#CFB28C]">{review.comment}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Related Products: "Mais desta coleção" */}
        <section aria-labelledby="related-heading" className="flex w-full flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2
              id="related-heading"
              className="font-mono text-[17px] leading-4 font-bold text-[#E89B55]"
            >
              Mais desta coleção
            </h2>
            <div className="w-full border-b border-[#D28A4C]/30" />
          </div>

          {/* 5 Cards Row */}
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:flex lg:justify-between lg:gap-[28px]">
            {related.map((item) => (
              <Link
                key={item.id}
                to="/nft/$nftId"
                params={{ nftId: item.id }}
                className="group flex flex-col gap-3 lg:w-[219px]"
              >
                <div className="flex h-[255px] w-full items-center justify-center rounded-[13px] bg-[#241612] p-3 transition-transform group-hover:scale-[1.02]">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="size-[212px] max-h-full max-w-full rounded-[13px] object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 font-mono">
                  <p className="truncate text-[15px] leading-5 text-[#F5F1EB] transition-colors group-hover:text-primary">
                    {item.name}
                  </p>
                  <p className="text-[16px] leading-4 font-bold text-[#E89B55]">
                    {formatEth(item.priceEth)} ETH
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Carousel Dots */}
          {relatedPageCount > 1 && (
            <div
              role="group"
              className="flex items-center justify-center gap-2 pt-2"
              aria-label="Navegação do carrossel"
            >
              {Array.from({ length: relatedPageCount }, (_, page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setActiveDot(page)}
                  aria-label={`Ir para a página ${page + 1} de ${relatedPageCount}`}
                  aria-current={activeRelatedPage === page ? 'true' : undefined}
                  className="flex size-6 cursor-pointer items-center justify-center p-1"
                >
                  <span
                    className={cn(
                      'size-[12px] rounded-full transition-colors',
                      activeRelatedPage === page ? 'bg-primary' : 'border-[1.3px] border-primary',
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Zoom da arte: Dialog (foco preso, Esc e retorno do foco ao gatilho). */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="flex max-h-[90vh] w-auto max-w-[90vw] flex-col items-center sm:max-w-[90vw]">
          <DialogTitle className="self-start pr-10">
            {nft.name} • {nft.collection}
          </DialogTitle>
          <DialogDescription className="sr-only">Arte ampliada do NFT.</DialogDescription>
          <img
            src={mainArtworkUrl}
            alt={`Arte digital de ${nft.name}, ampliada`}
            className="max-h-[75vh] max-w-[80vw] rounded-xl object-contain shadow-2xl"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
