import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderOptions } from './queries';
import { readPending, clearPending } from './pending';
import { clearCheckoutDraft } from '@/lib/session/checkout-draft';
import { keyFactory } from '@/lib/query/keys';
import { ErrorState } from '@/components/shared/ErrorState';
import { OrderItemsList } from '@/components/shared/OrderItemsList';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ThankYou from '@/assets/thank-you.svg?react';
import type { Order } from '@/types/api';
import { Price } from '@/components/shared/Price';
import { Button } from '@/components/ui/button';

const orderDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatOrderDate(value: string): string {
  const parts = orderDateFormatter.formatToParts(new Date(value));
  const day = parts.find((part) => part.type === 'day')!.value;
  const month = parts
    .find((part) => part.type === 'month')!
    .value.replace('.', '');
  const year = parts.find((part) => part.type === 'year')!.value;

  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${year}`;
}

const getOrderId = (order: Order) => {
  const map = new Map([
    ['pending', 'Aguardando confirmação do pedido.'],
    ['declined', `Pedido recusado: ${order.declineReason}`],
  ]);

  return map.get(order.status) || order.id;
};

export function OrderPage({
  userId,
  orderId,
}: {
  userId: string;
  orderId: string;
}) {
  const navigate = useNavigate();
  const query = useQuery(orderOptions(userId, orderId));
  const client = useQueryClient();
  const order = query.data;
  useEffect(() => {
    if (!order || order.status === 'pending') return;
    if (readPending(userId)?.key === order.idempotencyKey) {
      clearPending();
      if (order.status === 'confirmed') clearCheckoutDraft();
    }
    if (order.status === 'confirmed') {
      void client.invalidateQueries({ queryKey: keyFactory.cart(userId) });
      void client.invalidateQueries({
        queryKey: keyFactory.quote(userId).slice(0, 2),
      });
    }
  }, [order, client, userId]);
  if (query.isPending)
    return (
      <div role="status">
        <Skeleton />
        <span>Carregando pedido</span>
      </div>
    );
  if (query.isError)
    return (
      <ErrorState
        title="Não foi possível consultar o pedido"
        onRetry={() => void query.refetch()}
      />
    );
  if (!order) return null;
  const content = (
    <section className="grid min-w-0">
      {order.status === 'confirmed' ? (
        <DialogTitle asChild>
          <div className="flex flex-col items-center gap-4">
            <ThankYou />
            <h1 className="text-body-lg-bold text-secondary">
              Seus NFTs agora estão na sua carteira
            </h1>
          </div>
        </DialogTitle>
      ) : (
        <h1 className="text-body-lg-bold text-secondary">
          {order.status === 'declined'
            ? 'Pagamento recusado'
            : 'Pedido pendente'}
        </h1>
      )}

      <div className="text-secondary text-body my-6 grid grid-cols-4 gap-x-4 divide-x border-t border-b py-3.5">
        <div className="flex flex-col px-4">
          <h3 className="text-body-bold">ID da transação</h3>
          <span>{getOrderId(order)}</span>
        </div>
        <div className="flex flex-col px-4">
          <h3 className="text-body-regular">Data</h3>
          <time dateTime={order.createdAt}>
            {formatOrderDate(order.createdAt)}
          </time>
        </div>
        <div className="flex flex-col px-4">
          <h3 className="text-body-regular">Total</h3>
          <span>{order.total}</span>
        </div>
        <div className="flex flex-col px-4">
          <h3 className="text-body-regular">Carteira</h3>
          <span>{order.wallet.label}</span>
        </div>
      </div>

      {order.status === 'confirmed' && (
        <section aria-label="Recibo">
          <h2 className="text-body font-bold">Detalhes da transação</h2>
          <div className="text-body-lg-bold mb-3 grid grid-cols-3 border-b-[0.3px] pb-3">
            <span>NFTs</span>
            <span>Edições</span>
            <span>Subtotal</span>
          </div>
          <OrderItemsList items={order.items} />
          <div className="mb-3 flex justify-end border-b-[0.3px] pb-3">
            <div className="mt-3 flex w-80.25 flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-body">Taxa de rede</p>
                <span className="text-body-18-regular">
                  <Price value={order.networkFee} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-body-lg-bold">Total</p>
                <span className="text-body-lg-bold text-accent">
                  <Price value={order.total} />
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-5">
            <p className="text-tiny text-secondary text-center">
              Transação confirmada na Ethereum. A propriedade foi transferida
              para sua carteira conectada e registrada na rede.
            </p>
            <Button asChild size="lg">
              <a
                href={order.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver no Etherscan
              </a>
            </Button>
          </div>
        </section>
      )}
    </section>
  );
  if (order.status !== 'confirmed') return content;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void navigate({ to: '/cart' });
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="bg-surface-card max-h-dvh w-142 overflow-y-auto sm:max-w-142"
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
