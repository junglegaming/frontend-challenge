import { Link } from '@tanstack/react-router';
import { useSession } from '@/lib/session/state';
import type { CartController } from '../hooks/useCart';
import { errorCode } from '../queries';
import { CouponInput } from './CouponInput';
import { QuoteSummary } from './QuoteSummary';
import { CartSkeleton } from './CartSkeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLayoutEffect, useRef } from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

export function CartSummary({ controller }: { controller: CartController }) {
  const { session } = useSession();
  const { cart, quote } = controller;
  const desktop = useMediaQuery('(min-width: 768px)');
  const panelRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const spacer = spacerRef.current;
    if (!panel || !spacer || desktop) return;
    const measure = () => {
      spacer.style.height = `${panel.getBoundingClientRect().height}px`;
    };
    const viewport = window.visualViewport;
    const resize = () => {
      const height = viewport?.height ?? window.innerHeight;
      panel.style.maxHeight = `${height / 2}px`;
      panel.style.bottom = `${Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0))}px`;
      measure();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    resize();
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      viewport?.removeEventListener('resize', resize);
      viewport?.removeEventListener('scroll', resize);
      window.removeEventListener('resize', resize);
      panel.style.maxHeight = '';
      panel.style.bottom = '';
      spacer.style.height = '';
    };
  }, [desktop]);
  const Container = desktop ? 'div' : Card;
  return (
    <>
      <div
        ref={spacerRef}
        aria-hidden="true"
        className="md:hidden"
        data-cart-summary-spacer
      />
      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-20 max-h-[50dvh] overflow-y-auto md:static md:max-h-none md:overflow-visible"
        data-cart-summary-panel
      >
        <Container className="min-w-0">
          <section
            aria-label="Resumo da carteira"
            className="flex min-w-0 flex-col"
          >
            <h2 className="text-body-lg-bold border-primary mb-6 hidden border-b-[0.3px] pb-3 md:inline-block">
              Resumo da carteira
            </h2>
            <CouponInput
              coupon={controller.coupon}
              error={controller.couponError}
              pending={controller.couponPending || controller.pending}
              onApply={controller.applyCoupon}
              onRemove={controller.removeCoupon}
            />
            {quote.isFetching || controller.pending ? (
              <CartSkeleton summary />
            ) : quote.isError ? (
              <div role="alert" className="flex flex-col items-start">
                <p>
                  {errorCode(quote.error) === 'INSUFFICIENT_STOCK'
                    ? 'Estoque insuficiente. Ajuste ou remova os itens indisponíveis.'
                    : 'Não foi possível carregar a cotação.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void cart.refetch();
                    void quote.refetch();
                  }}
                >
                  Revalidar cotação
                </Button>
              </div>
            ) : (
              quote.data && <QuoteSummary quote={quote.data} />
            )}
            {quote.data?.available &&
              !quote.isFetching &&
              !quote.isError &&
              !controller.pending &&
              !controller.couponPending && (
                <Button asChild>
                  <Link to="/checkout" search={{ coupon: controller.coupon }}>
                    {session ? 'Finalizar compra' : 'Conectar e finalizar'}
                  </Link>
                </Button>
              )}
            <Button variant="ghost" className="mt-2">
              <Link to="/" search={{ sort: 'relevance', page: 1 }}>
                Continuar explorando
              </Link>
            </Button>
          </section>
        </Container>
      </div>
    </>
  );
}
