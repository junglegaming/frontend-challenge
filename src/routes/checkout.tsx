import { createFileRoute } from '@tanstack/react-router';
import { requireSession } from '@/lib/session/guards';
import { CheckoutPage } from '@/features/checkout/CheckoutPage';
import { checkoutSearchSchema } from '@/features/checkout/search-params';
export const Route = createFileRoute('/checkout')({
  validateSearch: checkoutSearchSchema,
  beforeLoad: async ({ location, context }) => ({
    checkoutSession: await requireSession({ location, context }),
  }),
  component: Page,
});
function Page() {
  const { checkoutSession } = Route.useRouteContext();
  const { coupon } = Route.useSearch();
  return (
    <CheckoutPage
      key={checkoutSession.user.id}
      userId={checkoutSession.user.id}
      coupon={coupon}
    />
  );
}
