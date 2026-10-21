import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAddToCart } from '@/domains/cart'
import { useToggleFavorite } from '@/domains/favorites'
import { isApiError } from '@/shared/api/http'
import { useIsAuthenticated } from '@/shared/api/use-is-authenticated'
import { CartIcon, HeartIcon } from '@/shared/icons'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { eth } from '@/shared/lib/eth'
import type { NftSummary } from '../model/contracts'

/** Default edition used by the grid's quick "add to cart" action (full edition picking happens on the detail page). */
function quickAddEditionId(nft: NftSummary) {
  return `${nft.id}_standard`
}

export function NftCard({ nft }: { nft: NftSummary }) {
  const authenticated = useIsAuthenticated()
  const addToCart = useAddToCart()
  const { isFavorite, toggle, isPending: isTogglingFavorite } = useToggleFavorite(nft.id)
  const soldOut = nft.totalAvailable <= 0

  function handleAddToCart() {
    addToCart.mutate(
      { nftId: nft.id, editionId: quickAddEditionId(nft), quantity: 1 },
      {
        onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho.`),
        onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível adicionar ao carrinho.'),
      },
    )
  }

  function handleFavorite() {
    if (!authenticated) {
      toast('Faça login para favoritar NFTs.')
      return
    }
    toggle()
  }

  return (
    <div className="group/card flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-card">
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block size-full focus-visible:outline-3 focus-visible:outline-ring">
          <img src={nft.image.src} alt={nft.image.alt} width={nft.image.width} height={nft.image.height} className="size-full object-cover" />
        </Link>

        {nft.featured && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Raro
          </Badge>
        )}

        <div className="absolute inset-x-2 bottom-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            aria-label={`Adicionar ${nft.name} ao carrinho`}
            disabled={soldOut || addToCart.isPending}
            onClick={handleAddToCart}
          >
            <CartIcon aria-hidden="true" size={16} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            disabled={isTogglingFavorite}
            onClick={handleFavorite}
          >
            <HeartIcon aria-hidden="true" size={16} className={cn(isFavorite && 'fill-current text-primary')} />
          </Button>
        </div>
      </div>

      <div>
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="text-body font-bold text-foreground hover:text-primary">
          {nft.name}
        </Link>
        <p className="text-body font-bold text-primary">{soldOut ? 'Esgotado' : eth.format(nft.priceFrom)}</p>
      </div>
    </div>
  )
}
