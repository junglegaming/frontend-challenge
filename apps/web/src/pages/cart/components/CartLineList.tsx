import { toast } from 'sonner'
import { useRemoveCartItem, useUpdateCartItem, type CartItem } from '@/domains/cart'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { CloseIcon } from '@/shared/icons'
import { QuantityStepper } from '@/shared/ui/quantity-stepper'
import { eth } from '@/shared/lib/eth'

const STATUS_MESSAGE: Record<Exclude<CartItem['status'], 'ok'>, string> = {
  price_changed: 'O preço desta edição mudou.',
  quantity_exceeds_stock: 'A quantidade foi ajustada ao estoque disponível.',
  sold_out: 'Esta edição está esgotada.',
}

function CartLine({ item }: { item: CartItem }) {
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const maxQuantity = Math.max(1, Math.min(item.available, item.maxPerOrder))
  const lineTotal = eth.mul(item.unitPrice, item.quantity)

  function setQuantity(next: number) {
    updateItem.mutate(
      { itemId: item.id, quantity: next },
      { onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível atualizar a quantidade.') },
    )
  }

  function remove() {
    removeItem.mutate(item.id, {
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível remover o item.'),
    })
  }

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-4 last:border-b-0 sm:grid-cols-[auto_1fr_auto_auto_auto]">
      <img src={item.image.src} alt={item.image.alt} width={64} height={64} className="size-16 rounded-lg object-cover" />
      <div>
        <p className="font-bold text-foreground">{item.name}</p>
        <p className="text-caption text-muted-foreground">ID do token: {item.editionId}</p>
        {item.status !== 'ok' && <p className="text-caption text-destructive">{STATUS_MESSAGE[item.status]}</p>}
      </div>
      <p className="text-body text-foreground sm:order-none">{eth.format(item.unitPrice)}</p>
      <QuantityStepper
        value={item.quantity}
        max={maxQuantity}
        disabled={item.status === 'sold_out' || updateItem.isPending}
        onChange={setQuantity}
        itemName={item.name}
      />
      <div className="col-span-3 flex items-center justify-between sm:col-span-1 sm:justify-end sm:gap-4">
        <p className="font-bold text-primary">{eth.format(lineTotal)}</p>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remover ${item.name} do carrinho`}
          disabled={removeItem.isPending}
          onClick={remove}
        >
          <CloseIcon aria-hidden="true" size={18} />
        </Button>
      </div>
    </div>
  )
}

export function CartLineList({ items }: { items: CartItem[] }) {
  return (
    <div>
      <div className="hidden border-b border-border pb-2 text-body font-bold text-muted-foreground sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4">
        <span className="col-start-2">NFTs</span>
        <span>Preço</span>
        <span>Edições</span>
        <span className="text-right">Total</span>
      </div>
      {items.map((item) => (
        <CartLine key={item.id} item={item} />
      ))}
    </div>
  )
}
