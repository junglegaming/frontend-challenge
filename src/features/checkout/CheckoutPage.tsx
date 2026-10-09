import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';

import { getStoredSession } from '@/lib/session/storage';
import { cartOptions, quoteOptions, errorCode } from '@/features/cart/queries';
import { profileOptions } from '@/features/profile/queries';
import { walletsOptions } from '@/features/wallets/queries';
import {
  readPending,
  savePending,
  clearPending,
  type PendingOrder,
} from '@/features/orders/pending';
import { recoverOrder } from '@/features/orders/queries';
import { restoreCheckoutDraft } from './draft';
import { CollectorForm } from './CollectorForm';
import { OrderReview } from './OrderReview';
import { WalletNetworkSelection } from './WalletNetworkSelection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Network } from '@/types/api';

export function CheckoutPage({
  userId,
  coupon: initialCoupon,
}: {
  userId: string;
  coupon?: string;
}) {
  const navigate = useNavigate();
  const [draft] = useState(() => restoreCheckoutDraft(userId));
  const coupon = initialCoupon ?? draft?.coupon;
  const [walletId, setWalletId] = useState(draft?.walletId ?? '');
  const [network, setNetwork] = useState<Network>(
    draft?.network === 'sepolia' ? 'sepolia' : 'ethereum'
  );
  const [connection, setConnection] = useState<
    'disconnected' | 'connecting' | 'connected' | 'rejected'
  >('disconnected');
  const [reviewVersion, setReviewVersion] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [attempt, setAttempt] = useState(() => readPending(userId));
  const [accountReady, setAccountReady] = useState(false);
  const identityRef = useRef<string | null>(null);
  const busy = useRef(false);
  const resumed = useRef(false);
  const profile = useQuery(profileOptions(userId));
  const wallets = useQuery(walletsOptions(userId));
  const cart = useQuery(cartOptions(userId));
  const quote = useQuery({
    ...quoteOptions(userId, coupon),
    enabled: !!cart.data?.items.length && !attempt,
  });
  const selected = wallets.data?.items.find((wallet) => wallet.id === walletId);
  const effectiveWallet =
    selected ??
    wallets.data?.items.find((wallet) => wallet.isPrimary) ??
    wallets.data?.items[0];
  const selectedId = effectiveWallet?.id ?? '';
  const effectiveNetwork = walletId
    ? network
    : (effectiveWallet?.network ?? network);
  const onCollectorState = useCallback(
    (state: { ready: boolean; identity: string; network: Network }) => {
      setAccountReady(state.ready);
      if (!state.ready) setReviewVersion(null);
      setNetwork(state.network);
      setWalletId(selectedId);
      if (
        identityRef.current !== null &&
        identityRef.current !== state.identity
      ) {
        setConnection('disconnected');
        setReviewVersion(null);
      }
      identityRef.current = state.identity;
    },
    [selectedId]
  );
  const mutation = useMutation({
    retry: 0,
    mutationFn: recoverOrder,
    onSuccess: (order) => {
      const current = readPending(userId);
      if (current) savePending({ ...current, orderId: order.id });
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
    },
    onError: async (error) => {
      const code = errorCode(error);
      if (
        code === 'QUOTE_STALE' ||
        code === 'INSUFFICIENT_STOCK' ||
        code === 'VALIDATION_ERROR' ||
        code === 'NOT_FOUND' ||
        code === 'COUPON_EXPIRED' ||
        code === 'COUPON_INVALID'
      ) {
        setConnection('disconnected');
        clearPending();
        setAttempt(null);
        setReviewVersion(null);
        setFeedback(
          code === 'QUOTE_STALE'
            ? 'Cotação alterada. Revise os valores e confirme novamente.'
            : 'Revise carteira, cupom e disponibilidade antes de tentar novamente.'
        );
        await cart.refetch();
        await quote.refetch();
      } else
        setFeedback(
          code === 'IDEMPOTENCY_CONFLICT'
            ? 'Tentativa divergente. Recupere o pedido com a tentativa original.'
            : 'Não foi possível obter o pedido. Tente novamente com a mesma chave.'
        );
    },
    onSettled: () => {
      busy.current = false;
    },
  });
  function send(value: PendingOrder) {
    if (busy.current || getStoredSession()?.user.id !== userId) return;
    busy.current = true;
    setFeedback('');
    mutation.mutate(value);
  }
  useEffect(() => {
    if (attempt && !resumed.current) {
      resumed.current = true;
      send(attempt);
    }
  });
  const compatible =
    !!effectiveWallet && effectiveNetwork === effectiveWallet.network;
  const ready =
    compatible &&
    accountReady &&
    connection === 'connected' &&
    reviewVersion === quote.data?.quoteVersion &&
    !!quote.data?.available &&
    !quote.isFetching &&
    !quote.isError &&
    !!cart.data?.items.length;
  function submit() {
    if (!ready || busy.current || attempt || !quote.data) return;
    const payload = {
      walletId: selectedId,
      network: effectiveNetwork,
      coupon: coupon ?? null,
      quoteVersion: quote.data.quoteVersion,
    };
    const value = {
      key: crypto.randomUUID(),
      userId,
      payload,
      payloadHash: JSON.stringify(payload),
    };
    savePending(value);
    setAttempt(value);
    resumed.current = true;
    send(value);
  }
  useEffect(() => {
    if (connection === 'connected' && ready && !attempt) submit();
  });
  if (attempt)
    return (
      <section>
        <h1>Recuperando pedido</h1>
        <p role="status">A tentativa original foi preservada.</p>
        {feedback && (
          <ErrorState title={feedback} onRetry={() => send(attempt)} />
        )}
        <Button
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
          onClick={() => send(attempt)}
        >
          Consultar tentativa
        </Button>
      </section>
    );
  if (profile.isPending || wallets.isPending || cart.isPending)
    return (
      <div role="status" aria-label="Carregando pagamento">
        <Skeleton />
        <span>Carregando pagamento</span>
      </div>
    );
  if (profile.isError || wallets.isError || cart.isError)
    return (
      <ErrorState
        title="Não foi possível carregar o pagamento"
        onRetry={() => {
          void profile.refetch();
          void wallets.refetch();
          void cart.refetch();
        }}
      />
    );
  if (!cart.data?.items.length)
    return (
      <section>
        <EmptyState
          title="Seu carrinho está vazio"
          description="Adicione NFTs antes de pagar."
          actionLabel="Voltar ao carrinho"
          onAction={() => void navigate({ to: '/cart' })}
        />
        <Link to="/cart">Voltar ao carrinho</Link>
      </section>
    );
  return (
    <section className="grid min-w-0">
      <h1 className="text-body mb-8 font-bold">Início / Mercado / Pagamento</h1>
      {!wallets.data?.items.length ? (
        <EmptyState
          title="Nenhuma carteira cadastrada"
          description="Cadastre uma carteira para continuar."
          actionLabel="Cadastre em Carteiras"
          onAction={() => void navigate({ to: '/wallets' })}
        />
      ) : (
        <>
          {profile.data && effectiveWallet && (
            <CollectorForm
              key={effectiveWallet.id}
              profile={profile.data}
              wallet={effectiveWallet}
              userId={userId}
              coupon={coupon}
              onState={onCollectorState}
              blocked={
                !quote.data?.available || quote.isFetching || quote.isError
              }
              onSaved={() => {
                setReviewVersion(quote.data?.quoteVersion ?? null);
                setConnection('connecting');
              }}
              walletPicker={
                <Select
                  value={selectedId}
                  onValueChange={(id) => {
                    const wallet = wallets.data?.items.find(
                      (item) => item.id === id
                    );
                    setWalletId(id);
                    setNetwork(wallet?.network ?? 'ethereum');
                    setConnection('disconnected');
                  }}
                >
                  <SelectTrigger aria-label="Carteira cadastrada">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.data.items.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            >
              <OrderReview
                cart={cart.data}
                coupon={coupon}
                totals={quote.data}
              />
              {quote.isPending && <p role="status">Carregando cotação</p>}
              {quote.isError && (
                <ErrorState
                  title="Não foi possível validar a cotação"
                  onRetry={() => void quote.refetch()}
                />
              )}
              <WalletNetworkSelection />
              {feedback && <p role="alert">{feedback}</p>}
            </CollectorForm>
          )}
          <Dialog
            open={connection === 'connecting'}
            onOpenChange={(open) => {
              if (!open && connection === 'connecting')
                setConnection('rejected');
            }}
          >
            <DialogContent>
              <DialogTitle>Autorizar conexão simulada</DialogTitle>
              <DialogDescription>
                Conectar {effectiveWallet?.label} na rede {effectiveNetwork}.
                Nenhuma transação real será realizada.
              </DialogDescription>
              <p role="status" aria-live="polite" aria-atomic="true">
                {reviewVersion !== null &&
                reviewVersion !== quote.data?.quoteVersion
                  ? 'Cotação alterada. Revise os valores antes de confirmar.'
                  : ''}
              </p>
              <Button
                disabled={
                  reviewVersion !== quote.data?.quoteVersion ||
                  !compatible ||
                  !accountReady ||
                  !quote.data?.available ||
                  quote.isFetching ||
                  quote.isError
                }
                onClick={() => setConnection('connected')}
              >
                Autorizar
              </Button>
              <Button onClick={() => setConnection('rejected')}>
                Rejeitar
              </Button>
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  );
}
