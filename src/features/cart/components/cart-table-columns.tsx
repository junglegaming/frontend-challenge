import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import type { CartItem as Item } from '@/types/api';
import { CartItem } from './CartItem';
import { CartPrice } from './CartPrice';
import { CartEdition } from './CartEdition';
import { CartTotal } from './CartTotal';
import { CartActions } from './CartActions';

export const cartTableFeatures = tableFeatures({});
const columnHelper = createColumnHelper<typeof cartTableFeatures, Item>();

export function createCartColumns({
  pending,
  onChange,
}: {
  pending: boolean;
  onChange: (nftId: string, qty?: number) => void;
}) {
  return columnHelper.columns([
    columnHelper.accessor('name', {
      header: 'NFT',
      cell: ({ row }) => <CartItem item={row.original} />,
    }),
    columnHelper.accessor('price', {
      header: 'Preço',
      cell: ({ row }) => <CartPrice item={row.original} />,
    }),
    columnHelper.accessor('edition', {
      header: 'Edições',
      cell: ({ row }) => (
        <CartEdition
          item={row.original}
          pending={pending}
          onChange={(qty) => onChange(row.original.nftId, qty)}
        />
      ),
    }),
    columnHelper.accessor('lineTotal', {
      header: 'Total',
      cell: ({ row }) => <CartTotal item={row.original} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <CartActions
          item={row.original}
          pending={pending}
          onRemove={() => onChange(row.original.nftId)}
        />
      ),
    }),
  ]);
}
