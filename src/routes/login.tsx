import { createFileRoute, redirect } from '@tanstack/react-router';
import { parseLoginSearch } from '@/features/auth/search-params';
import { authLocation } from '@/features/auth/navigation';

export const Route = createFileRoute('/login')({
  validateSearch: parseLoginSearch,
  beforeLoad: ({ search }) => {
    throw redirect({
      ...authLocation('/', 'login', search.redirect),
      replace: true,
    });
  },
});
