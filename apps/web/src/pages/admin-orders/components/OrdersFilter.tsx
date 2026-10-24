import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/domains/admin'
import type { OrderStatus } from '@/domains/orders'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'

const isStatus = (value: string): value is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(value)

/** Status filter. "Todos" means no filter: the caller then leaves `status` out of the address. */
export function OrdersFilter({ status, onChange }: { status: OrderStatus | undefined; onChange: (status: OrderStatus | undefined) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Label htmlFor="orders-status">Estado</Label>
      <Select
        id="orders-status"
        className="w-48"
        value={status ?? ''}
        onChange={(event) => onChange(isStatus(event.target.value) ? event.target.value : undefined)}
      >
        <option value="">Todos</option>
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </Select>
    </div>
  )
}
