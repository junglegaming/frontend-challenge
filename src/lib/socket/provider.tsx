import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session/state';
import { queryClient } from '@/lib/query/client';
import { keyFactory } from '@/lib/query/keys';
import { connectSocket, disconnectSocket, socket } from './client';
import { applyOrderEvent } from './order-cache';
import { applyNftEvent } from './nft-cache';
import { toast } from 'sonner';
import { displayEth, cmpEth } from '@/lib/money';
import type { Cart } from '@/types/api';
import { getStoredSession } from '@/lib/session/storage';

export function SocketProvider() {
  const { session } = useSession();
  const token = session?.token;
  const userId = session?.user.id;
  const [announcement, setAnnouncement] = useState<{
    token: string | undefined;
    message: string;
  }>();
  useEffect(() => {
    // Storage can change before React runs the previous effect's cleanup.
    const sameSession = () => getStoredSession()?.token === token;
    const onNftUpdated = (raw: unknown) => {
      if (!sameSession()) return;
      const event = applyNftEvent(queryClient, raw);
      if (!event) return;
      const item = queryClient
        .getQueryData<Cart>(keyFactory.cart(userId))
        ?.items.find((entry) => entry.nftId === event.resourceId);
      const message = item
        ? `${item.name}: preço ${displayEth(event.payload.price)}, disponibilidade ${event.payload.available}. Revise os valores antes de confirmar.`
        : 'Preço e disponibilidade do NFT atualizados.';
      setAnnouncement({ token, message });
      if (
        item &&
        cmpEth(event.payload.price, event.payload.previousPrice) !== 0
      )
        toast.info(
          `${item.name}: preço alterado de ${displayEth(event.payload.previousPrice)} para ${displayEth(event.payload.price)}`
        );
    };
    const reconcile = () => {
      if (!sameSession()) return;
      void queryClient.invalidateQueries({ queryKey: keyFactory.cart(userId) });
      void queryClient.invalidateQueries({
        queryKey: keyFactory.quote(userId).slice(0, 2),
      });
      void queryClient.invalidateQueries({
        queryKey: keyFactory.nfts.all,
        predicate: (query) => query.queryKey[1] !== 'event',
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'order' &&
          !!userId &&
          keyFactory.belongsToUser(query.queryKey, userId) &&
          (query.state.data as { status?: string } | undefined)?.status ===
            'pending',
      });
    };
    const onOrderUpdated = (raw: unknown) => {
      if (!sameSession()) return;
      const event = applyOrderEvent(userId, raw);
      if (event)
        setAnnouncement({
          token,
          message: `Pedido ${event.resourceId}: ${
            event.payload.status === 'confirmed'
              ? 'pagamento confirmado'
              : event.payload.status === 'declined'
                ? 'pagamento recusado'
                : 'pendente'
          }.`,
        });
    };
    socket.on('order.updated', onOrderUpdated);
    socket.on('connect', reconcile);
    socket.on('nft.updated', onNftUpdated);
    connectSocket(token);
    return () => {
      socket.off('order.updated', onOrderUpdated);
      socket.off('connect', reconcile);
      socket.off('nft.updated', onNftUpdated);
      disconnectSocket();
    };
  }, [token, userId]);
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {announcement?.token === token ? announcement?.message : ''}
    </div>
  );
}
