import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Heart, Loader2, Search, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useAddToCart } from '@/hooks/useCart'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { useSession } from '@/hooks/useSession'
import { nftImageProps } from '@/lib/images'
import { cn } from '@/lib/utils'
import type { NftSummary } from '@/schemas/nft'
import { EthPrice } from './EthPrice'

interface NftCardProps {
  nft: NftSummary
  /** Primeira dobra: carrega com prioridade (LCP). */
  priority?: boolean
  className?: string
  /** Ações extras sobre a imagem. */
  actions?: React.ReactNode
}

const actionButton =
  'grid size-8 place-items-center rounded-lg border border-border-soft bg-background/90 text-foreground transition-colors hover:text-accent-text focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60'

export function NftCard({ nft, priority = false, className, actions }: NftCardProps) {
  const { href } = useLocation()
  const navigate = useNavigate()
  const { user, isLoading: sessionLoading } = useSession()
  const favorites = useFavorites()
  const favorite = favorites.isFavorite(nft.id)
  const favoriteMutation = useToggleFavorite()
  const addToCart = useAddToCart()

  const toggleFavorite = () => {
    if (sessionLoading || favoriteMutation.isPending) return
    if (!user) {
      void navigate({ to: '/login', search: { redirect: href } })
      return
    }
    favoriteMutation.mutate({ nftId: nft.id, favorite: !favorite })
  }

  const add = () => {
    addToCart.mutate(
      { nftId: nft.id, editionId: '1/50', quantity: 1 },
      {
        onSuccess: () => toast.success('NFT adicionado ao carrinho'),
        onError: (error) =>
          toast.error(
            error instanceof ApiError && error.code === 'OUT_OF_STOCK'
              ? error.message
              : 'Não foi possível adicionar ao carrinho. Tente novamente.',
          ),
      },
    )
  }

  return (
    <article className={cn('group relative flex flex-col gap-2 md:gap-3', className)}>
      <div className="relative flex aspect-[7/8] items-center rounded-2xl bg-card p-1 md:aspect-[43/50] md:rounded-none">
        <div className="relative w-full">
          <img
            {...nftImageProps(nft.image)}
            alt={`Arte do NFT ${nft.name}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="aspect-square w-full rounded-2xl object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
          />
          {nft.badge && (
            <span className="absolute top-0 left-0 z-10 inline-flex h-8 min-w-[68px] items-center justify-center bg-primary px-4 text-sm leading-none font-bold text-primary-foreground">
              {nft.badge}
            </span>
          )}
          {nft.available === 0 && (
            <span className="absolute bottom-0 left-0 z-10 bg-background/90 px-2 py-1 text-xs font-bold text-foreground">Esgotado</span>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              toggleFavorite()
            }}
            disabled={sessionLoading || favoriteMutation.isPending}
            aria-pressed={favorite}
            aria-busy={favoriteMutation.isPending}
            aria-label={favorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            className="absolute top-2.5 right-2.5 z-10 grid size-7 place-items-center rounded-full border border-border-soft bg-background/90 text-primary transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60 md:hidden"
          >
            {favoriteMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Heart className={cn('size-3.5', favorite && 'fill-primary')} aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="pointer-events-none absolute right-1.5 bottom-1.5 z-20 hidden gap-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 md:flex">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              add()
            }}
            disabled={addToCart.isPending}
            aria-label={`Adicionar ${nft.name} ao carrinho`}
            aria-busy={addToCart.isPending}
            className={actionButton}
          >
            {addToCart.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingCart className="size-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              toggleFavorite()
            }}
            disabled={sessionLoading || favoriteMutation.isPending}
            aria-pressed={favorite}
            aria-busy={favoriteMutation.isPending}
            aria-label={favorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            className={actionButton}
          >
            {favoriteMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Heart className={cn('size-4', favorite && 'fill-primary')} aria-hidden="true" />
            )}
          </button>
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            aria-label={`Ver ${nft.name}`}
            className={actionButton}
          >
            <Search className="size-4" aria-hidden="true" />
          </Link>
          {actions}
        </div>
      </div>

      <div className="flex flex-col gap-0 md:gap-3">
        <h3 className="text-sm leading-5 md:text-base md:leading-4">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <EthPrice value={nft.price} previous={nft.compareAtPrice} className="text-sm leading-4 md:text-base md:leading-4" />
      </div>
    </article>
  )
}
