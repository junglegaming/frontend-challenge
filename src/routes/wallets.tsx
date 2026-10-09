import { createFileRoute } from '@tanstack/react-router';
import { requireSession } from '@/lib/session/guards';
import { WalletsPage } from '@/features/wallets/WalletsPage';

export const Route = createFileRoute('/wallets')({
  beforeLoad: async ({ location, context }) => ({
    accountSession: await requireSession({ location, context }),
  }),
  component: Page,
});
function Page() {
  const { accountSession } = Route.useRouteContext();
  return (
    <WalletsPage key={accountSession.user.id} userId={accountSession.user.id} />
  );
}
