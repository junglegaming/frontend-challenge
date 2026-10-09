import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/session/state';
import { cartOptions } from '../queries';

export function useCartCount() {
  const { session, isHydrating, error } = useSession();
  const { data } = useQuery({
    ...cartOptions(session?.user.id),
    enabled: !isHydrating && !error,
    select: (cart) => cart.itemCount,
  });

  return data ?? 0;
}
