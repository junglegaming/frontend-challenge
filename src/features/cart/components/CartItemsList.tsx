import type { CartItem as Item } from '@/types/api';
import { CartItem } from './CartItem';
import { CartTotal } from './CartTotal';
import { CartEdition } from './CartEdition';
import { CartActions } from './CartActions';

export function CartItemsList({
  items,
  pending,
  onChange,
}: {
  items: Item[];
  pending: boolean;
  onChange: (nftId: string, qty?: number) => void;
}) {
  return (
    <ul
      aria-label="Itens do carrinho"
      aria-busy={pending}
      className="flex min-w-0 flex-col"
    >
      {items.map((item) => (
        <li
          key={item.nftId}
          aria-label={item.name}
          className="flex min-w-0 flex-col"
        >
          <CartItem item={item}>
            <p>
              Edição: {item.edition.current}/{item.edition.total}
            </p>
            <CartTotal item={item} />
            <div className="flex w-full flex-wrap items-center justify-between">
              <CartEdition
                item={item}
                pending={pending}
                onChange={(qty) => onChange(item.nftId, qty)}
              />
              <CartActions
                item={item}
                pending={pending}
                onRemove={() => onChange(item.nftId)}
              />
            </div>
          </CartItem>
        </li>
      ))}
    </ul>
  );
}
