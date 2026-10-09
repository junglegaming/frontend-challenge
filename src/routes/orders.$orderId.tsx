import { createFileRoute } from '@tanstack/react-router';
import { requireSession } from '@/lib/session/guards';
import { OrderPage } from '@/features/orders/OrderPage';
export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: async ({ location, context }) => ({
    orderSession: await requireSession({ location, context }),
  }),
  component: Page,
});
function Page() {
  const { orderSession } = Route.useRouteContext();
  const { orderId } = Route.useParams();
  return (
    <OrderPage
      key={`${orderSession.user.id}:${orderId}`}
      userId={orderSession.user.id}
      orderId={orderId}
    />
  );
}
