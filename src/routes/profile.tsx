import { createFileRoute } from '@tanstack/react-router';
import { requireSession } from '@/lib/session/guards';
import { ProfilePage } from '@/features/profile/ProfilePage';

export const Route = createFileRoute('/profile')({
  beforeLoad: async ({ location, context }) => ({
    accountSession: await requireSession({ location, context }),
  }),
  component: Page,
});
function Page() {
  const { accountSession } = Route.useRouteContext();
  return (
    <ProfilePage key={accountSession.user.id} userId={accountSession.user.id} />
  );
}
