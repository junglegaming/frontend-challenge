import type { CartItem as Item } from '@/types/api';
import { displayEth } from '@/lib/money';

export function CartPrice({ item }: { item: Item }) {
  return (
    <span className="text-body-lg-bold text-secondary flex items-center gap-4">
      {displayEth(item.price)}
    </span>
  );
}
