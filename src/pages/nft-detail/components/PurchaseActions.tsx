import { Heart, Loader2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useAddToCart } from '@/domains/cart'
import { useToggleFavorite } from '@/domains/favorites'
import { useIsAuthenticated } from '@/shared/api/use-is-authenticated'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

export function PurchaseActions({
  nftId,
  editionId,
  nftName,
  quantity,
  disabled,
}: {
  nftId: string
  editionId: string
  nftName: string
  quantity: number
  disabled: boolean
}) {
  const authenticated = useIsAuthenticated()
  const addToCart = useAddToCart()
  const { isFavorite, toggle, isPending: isTogglingFavorite } = useToggleFavorite(nftId)

  const handleBuy = () => {
    addToCart.mutate(
      { nftId, editionId, quantity },
      {
        onSuccess: () => toast.success(`${nftName} adicionado ao carrinho.`),
        onError: (error) => {
          toast.error(isApiError(error) ? error.message : 'Não foi possível adicionar ao carrinho.')
        },
      },
    )
  }

  const handleFavorite = () => {
    if (!authenticated) {
      toast('Faça login para favoritar NFTs.')
      return
    }
    toggle()
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg" className="gap-2" disabled={disabled || addToCart.isPending} onClick={handleBuy}>
        {addToCart.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
        Comprar
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="gap-2"
        disabled={isTogglingFavorite}
        aria-pressed={isFavorite}
        onClick={handleFavorite}
      >
        <Heart aria-hidden="true" className={cn(isFavorite && 'fill-current text-primary')} />
        {isFavorite ? 'Favoritado' : 'Favoritar'}
      </Button>
    </div>
  )
}
