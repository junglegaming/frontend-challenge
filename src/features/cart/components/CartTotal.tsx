import { displayEth } from '@/lib/money';
import type { CartItem as Item } from '@/types/api';

export function CartTotal({ item }: { item: Item }) {
  return (
    <span className="text-body-lg-bold text-accent">
      {displayEth(item.lineTotal, { maxDecimals: 4 })}
    </span>
  );
}
