import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/components/common/ErrorState'
import { EthPrice } from '@/components/common/EthPrice'
import { nftImageProps } from '@/lib/images'
import { formatEth } from '@/lib/eth'
import { EDITION_LABELS } from '@/schemas/nft'
import type { CartItem } from '@/schemas/cart'
import { useAddToCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart'
import { QuantityStepper } from './QuantityStepper'

interface CartLineProps {
  item: CartItem
}

export function CartLine({ item }: CartLineProps) {
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const addItem = useAddToCart()
  const warningId = useId()

  const outOfStock = item.available === 0
  const exceedsStock = item.quantity > item.available && !outOfStock
  const busy = updateItem.isPending || removeItem.isPending
  const priceChanged = !outOfStock && item.priceChanged && item.previousUnitPrice != null

  const handleQuantity = (quantity: number) => {
    updateItem.mutate(
      { itemId: item.id, quantity },
      {
        onError: (error) => toast.error(errorMessage(error, 'Não foi possível atualizar a quantidade')),
      },
    )
  }

  const handleRemove = () => {
    removeItem.mutate(item.id, {
      onSuccess: () => {
        toast(`${item.name} removido do carrinho`, {
          description: `Edição ${EDITION_LABELS[item.editionId]} · ${item.quantity} ${item.quantity === 1 ? 'unidade' : 'unidades'}`,
          action: {
            label: 'Desfazer',
            onClick: () => {
              addItem.mutate(
                { nftId: item.nftId, editionId: item.editionId, quantity: item.quantity },
                {
                  onSuccess: () => toast.success(`${item.name} voltou para o carrinho`),
                  onError: (error) => toast.error(errorMessage(error, 'Não foi possível desfazer a remoção')),
                },
              )
            },
          },
        })
      },
      onError: (error) => toast.error(errorMessage(error, 'Não foi possível remover o item')),
    })
  }

  const removeButton = (
    <button
      type="button"
      onClick={handleRemove}
      disabled={removeItem.isPending}
      aria-label={removeItem.isPending ? `Removendo ${item.name} do carrinho` : `Remover ${item.name} do carrinho`}
      className="grid size-8 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-background/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {removeItem.isPending ? (
        <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <Trash2 className="size-6" aria-hidden="true" />
      )}
    </button>
  )

  const stepper = (
    <div className="flex flex-col gap-1">
      <QuantityStepper
        value={item.quantity}
        max={item.available}
        onChange={handleQuantity}
        label={item.name}
        pending={updateItem.isPending}
        describedBy={exceedsStock ? warningId : undefined}
      />
      {exceedsStock && (
        <p id={warningId} className="text-[11px] text-accent-text">
          Apenas {item.available} disponível(is) nesta edição.
        </p>
      )}
    </div>
  )

  return (
    <li aria-busy={busy}>
      <article>
        <div className="relative flex h-[100px] overflow-hidden rounded-xl bg-card md:hidden">
          <img
            {...nftImageProps(item.image, '100px')}
            alt={`Arte do NFT ${item.name}`}
            loading="lazy"
            decoding="async"
            className="h-[100px] w-[100px] shrink-0 rounded-l-xl object-cover"
          />
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-4 pl-[9px]">
            <div className="flex h-full min-w-0 flex-1 flex-col pt-[13px] pb-2">
              <h3 className="truncate text-[15px] leading-4 font-bold">
                <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="transition-colors hover:text-accent-text">
                  {item.name}
                </Link>
              </h3>
              <p className="mt-1.5 text-xs text-subtle">Edição: {EDITION_LABELS[item.editionId]}</p>
              <div className="mt-auto flex items-baseline">
                <span className="sr-only">Subtotal do item: </span>
                <EthPrice value={item.lineTotal} className="text-lg text-accent-text" />
              </div>
            </div>
            <div className="shrink-0">{stepper}</div>
          </div>
          <div className="absolute top-1 right-1">{removeButton}</div>
        </div>

        <div className="hidden h-[70px] grid-cols-[minmax(0,1fr)_138px_136px_148px_48px] items-center bg-card md:grid">
          <div className="flex min-w-0 items-center gap-4">
            <img
              {...nftImageProps(item.image, '70px')}
              alt={`Arte do NFT ${item.name}`}
              loading="lazy"
              decoding="async"
              className="h-[70px] w-[70px] shrink-0 rounded object-cover"
            />
            <div className="min-w-0">
              <h3 className="truncate text-sm leading-4 font-bold">
                <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="transition-colors hover:text-accent-text">
                  {item.name}
                </Link>
              </h3>
              <p className="mt-1.5 text-xs leading-4 text-subtle">ID do token: {item.tokenId}</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
            <span className="sr-only">Preço unitário: </span>
            <span>{formatEth(item.unitPrice)}</span>
            {priceChanged && item.previousUnitPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatEth(item.previousUnitPrice)}</span>
            )}
          </div>
          <div>{stepper}</div>
          <div className="flex items-baseline">
            <span className="sr-only">Subtotal do item: </span>
            <EthPrice value={item.lineTotal} className="text-base text-accent-text" />
          </div>
          <div>{removeButton}</div>
        </div>

        {outOfStock && (
          <p role="status" aria-live="polite" className="mt-2 rounded-sm border border-destructive/50 px-3 py-2 text-xs text-destructive">
            Esgotado — remova este item para finalizar a compra.
          </p>
        )}
        {priceChanged && (
          <p role="status" aria-live="polite" className="mt-2 rounded-sm border border-border-soft bg-background/40 px-3 py-2 text-xs text-accent-text">
            Preço alterado de {formatEth(item.previousUnitPrice!)} para {formatEth(item.unitPrice)}.
            <span className="block text-muted-foreground">O total da linha foi atualizado pela loja.</span>
          </p>
        )}
      </article>
    </li>
  )
}
