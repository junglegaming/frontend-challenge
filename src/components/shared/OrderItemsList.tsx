import { CartItem } from '@/features/cart/components/CartItem';
import { displayEth } from '@/lib/money';
import type { CartItem as Item } from '@/types/api';

type OrderListItem = Pick<
  Item,
  'nftId' | 'tokenId' | 'name' | 'image' | 'qty' | 'lineTotal'
>;

export function OrderItemsList({ items }: { items: readonly OrderListItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.nftId}
          className="bg-surface-card grid min-w-0 grid-cols-2 items-center sm:grid-cols-[minmax(0,1fr)_auto_auto]"
        >
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <CartItem item={item} />
          </div>
          <span className="text-body-sm text-secondary mr-5">
            (x {item.qty})
          </span>
          <span className="text-body-18-bold text-accent justify-self-end pr-2.75">
            {displayEth(item.lineTotal)}
          </span>
        </li>
      ))}
    </ul>
  );
}
