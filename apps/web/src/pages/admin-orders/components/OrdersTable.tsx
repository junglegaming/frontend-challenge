import { Link } from '@tanstack/react-router'
import { OrderStatusBadge, type AdminOrderSummary } from '@/domains/admin'
import { eth } from '@/shared/lib/eth'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Read-only list of orders; each id opens the detail through the router. Scrolls inside its box on narrow screens. */
export function OrdersTable({ orders }: { orders: AdminOrderSummary[] }) {
  return (
    <div role="region" aria-label="Lista de pedidos" tabIndex={0} className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-body">
        <caption className="sr-only">Pedidos de todos os usuários</caption>
        <thead>
          <tr className="border-b border-border">
            {['Pedido', 'Comprador', 'Itens', 'Total', 'Estado', 'Data'].map((heading) => (
              <th key={heading} scope="col" className="whitespace-nowrap py-2 pr-4 font-bold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border">
              <td className="whitespace-nowrap py-2 pr-4">
                <Link to="/admin/orders/$orderId" params={{ orderId: order.id }} className="text-primary underline">
                  {order.id}
                </Link>
              </td>
              <td className="py-2 pr-4">
                {order.buyer.fullName}
                <span className="block text-caption text-muted-foreground">{order.buyer.email}</span>
              </td>
              <td className="py-2 pr-4">{order.itemCount}</td>
              <td className="whitespace-nowrap py-2 pr-4">{eth.format(order.total)}</td>
              <td className="py-2 pr-4">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="whitespace-nowrap py-2 text-muted-foreground">{dateFormat.format(new Date(order.createdAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
