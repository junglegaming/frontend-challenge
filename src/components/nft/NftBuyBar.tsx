import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { EthPrice } from '@/components/common/EthPrice'
import { Button } from '@/components/ui/button'
import { NftQuantityStepper } from './NftQuantityStepper'

interface NftBuyBarProps {
  price: string
  quantity: number
  max: number
  onQuantityChange: (quantity: number) => void
  onBuy: () => void
  isPending: boolean
  error: string | null
}

export function NftBuyBar({ price, quantity, max, onQuantityChange, onBuy, isPending, error }: NftBuyBarProps) {
  const soldOut = max <= 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[32px] border-t border-border bg-card px-6 pt-5 pb-[max(34px,env(safe-area-inset-bottom))] md:hidden">
      {error && (
        <p role="alert" className="mb-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex h-[30px] items-center justify-between gap-4">
        <NftQuantityStepper
          variant="compact"
          quantity={quantity}
          max={max}
          onChange={onQuantityChange}
          disabled={isPending}
        />
        <EthPrice value={price} className="text-xl leading-6" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button
          className="h-[60px] w-[196px] rounded-full text-lg"
          onClick={onBuy}
          disabled={soldOut || isPending}
        >
          {soldOut ? 'Esgotado' : isPending ? 'Adicionando…' : 'Comprar NFT'}
        </Button>
        <Button
          asChild
          variant="outline"
          size="icon"
          className="size-[60px] shrink-0 rounded-full border-border-soft bg-background/30 text-foreground"
        >
          <Link to="/cart" aria-label="Ver carrinho">
            <ShoppingCart className="size-5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
