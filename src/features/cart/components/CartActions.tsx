import type { CartItem as Item } from '@/types/api';
import DeleteIcon from '@/assets/delete.svg?react';

export function CartActions({
  item,
  pending,
  onRemove,
}: {
  item: Item;
  pending: boolean;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onRemove}
      aria-label={`Remover ${item.name}`}
    >
      <DeleteIcon />
    </button>
  );
}
