import { QuantityStepper } from '@/components/shared/QuantityStepper';
import type { CartItem as Item } from '@/types/api';

export function CartEdition({
  item,
  pending,
  onChange,
}: {
  item: Item;
  pending: boolean;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="flex flex-col items-start">
      <QuantityStepper
        className="flex items-center"
        value={item.qty}
        max={item.available}
        disabled={pending}
        onChange={onChange}
        size="sm"
      />
      {item.qty > item.available && (
        <p role="alert">
          Quantidade acima do estoque. Reduza para até {item.available} ou
          remova o item.
        </p>
      )}
    </div>
  );
}
