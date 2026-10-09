import { createFileRoute, redirect } from '@tanstack/react-router';
import { parseLoginSearch } from '@/features/auth/search-params';
import { authLocation } from '@/features/auth/navigation';

export const Route = createFileRoute('/signup')({
  validateSearch: parseLoginSearch,
  beforeLoad: ({ search }) => {
    throw redirect({
      ...authLocation('/', 'signup', search.redirect),
      replace: true,
    });
  },
});
