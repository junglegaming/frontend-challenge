import type { OrderStatus } from '@/domains/orders'
import { Badge } from '@/shared/ui/badge'
import { ORDER_STATUS_LABELS } from '../model/contracts'

const VARIANT: Record<OrderStatus, { variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
  confirmed: { variant: 'default' },
  pending: { variant: 'secondary' },
  // White on the destructive red fails the contrast check: outline with the destructive text color passes.
  declined: { variant: 'outline', className: 'border-destructive text-destructive' },
}

/** Order status as text AND color (never color alone), shared by the admin list and detail. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge {...VARIANT[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
}
