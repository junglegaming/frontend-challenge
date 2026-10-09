import { useMemo } from 'react';
import { useTable } from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import type { CartItem } from '@/types/api';
import { cartTableFeatures, createCartColumns } from './cart-table-columns';

export function CartItemsTable({
  items,
  pending,
  onChange,
}: {
  items: CartItem[];
  pending: boolean;
  onChange: (nftId: string, qty?: number) => void;
}) {
  const columns = useMemo(
    () => createCartColumns({ pending, onChange }),
    [pending, onChange]
  );
  const table = useTable({
    features: cartTableFeatures,
    columns,
    data: items,
    getRowId: (item) => item.nftId,
  });
  return (
    <Table
      aria-label="Itens do carrinho"
      aria-busy={pending}
      className="border-separate border-spacing-0"
    >
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                scope="col"
                className="text-body-lg-bold border-primary h-auto border-b-[0.3px] pb-3"
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            aria-label={row.original.name}
            aria-busy={pending}
            className="group hover:bg-transparent"
          >
            {row.getAllCells().map((cell) => (
              <TableCell
                key={cell.id}
                className="bg-surface-card group-hover:bg-muted/50 border-t-12 border-transparent bg-clip-padding p-0"
              >
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
