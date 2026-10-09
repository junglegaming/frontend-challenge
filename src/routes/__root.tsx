import {
  Outlet,
  createRootRouteWithContext,
  Link,
  useRouterState,
} from '@tanstack/react-router';
import type { RouterContext } from '@/lib/session/demo';
import { subscribeSession } from '@/lib/session/storage';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSession } from '@/lib/session/state';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { parseAuthSearch } from '@/features/auth/search-params';
import { SocketProvider } from '@/lib/socket/provider';
import { AccountActions } from '@/components/shared/AccountActions';
import { sessionService } from '@/lib/session/service';
import { openAuth } from '@/features/auth/navigation';

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: parseAuthSearch,
  component: RootComponent,
  notFoundComponent: RootNotFoundComponent,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  const { session } = useSession();

  const { demoSession } = Route.useRouteContext();
  const router = useRouter();
  const isCatalog = useRouterState({
    select: (state) => state.location.pathname === '/',
  });
  const isTest = useRouterState({
    select: (state) => state.location.pathname === '/teste',
  });
  const isNftDetail = useRouterState({
    select: (state) => state.location.pathname.startsWith('/nfts/'),
  });
  const isOrder = useRouterState({
    select: (state) => state.location.pathname.startsWith('/orders/'),
  });
  useEffect(
    () =>
      subscribeSession(() => {
        if (
          sessionService.getSnapshot().endReason === 'expired' &&
          !router.state.location.search.auth
        ) {
          void openAuth(router);
        } else void router.invalidate();
      }),
    [router]
  );

  return (
    <div className="bg-ink text-foreground min-h-screen font-mono">
      {/* Barra de utilidades / status de sessão para dev e testes */}
      <div
        className={`border-border bg-surface-card text-tiny border-b px-4 py-2 ${isTest ? '' : 'hidden'}`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">NFT Marketplace Router</span>
            <span className="text-text-secondary">|</span>
            <span>
              Sessão:{' '}
              {session ? (
                <span className="text-success font-semibold">
                  Ativa ({session.user.name} - {session.user.email})
                </span>
              ) : (
                <span className="text-coral">Não autenticado</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {demoSession &&
              (session ? (
                <button
                  type="button"
                  onClick={() => demoSession?.logout()}
                  className="border-coral/50 bg-coral/10 text-coral hover:bg-coral/20 cursor-pointer rounded border px-2 py-0.5"
                >
                  Simular Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => demoSession?.login()}
                  className="border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer rounded border px-2 py-0.5"
                >
                  Simular Login Rápido (Ana)
                </button>
              ))}
          </div>
        </div>
      </div>

      <main
        className={`mx-auto max-w-[1640px] md:px-30 md:py-6 ${isNftDetail ? 'p-0' : 'px-6 py-10'} ${isCatalog ? 'catalog-layout' : ''}`}
      >
        {!isOrder && (
          <div className={isNftDetail ? 'hidden md:block' : undefined}>
            <Header
              marketHref={isNftDetail ? '/#catalogo' : '#catalogo'}
              learnHref={isNftDetail ? '/#diario' : '#diario'}
              creatorsHref={isNftDetail ? '/#criadores' : '#criadores'}
              divider={!!isCatalog}
            />
            {(!isCatalog || session) && (
              <div className="mb-6 flex justify-end md:hidden">
                <AccountActions />
              </div>
            )}
          </div>
        )}
        <Outlet />
        {!isOrder && (
          <div className={isNftDetail ? 'hidden md:block' : undefined}>
            <Footer />
          </div>
        )}
      </main>
      <SocketProvider />
      <AuthModal />
    </div>
  );
}

function RootErrorComponent({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  return (
    <div className="border-coral/40 bg-surface-card text-foreground space-y-4 rounded-md border p-6 font-mono">
      <h2 className="text-h2 text-coral font-bold">Erro ao carregar rota</h2>
      <p className="text-body-sm text-foreground/80">
        {error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="border-border bg-surface-raised text-tiny hover:border-primary rounded border px-4 py-2"
        >
          Tentar novamente
        </button>
        <Link
          to="/"
          search={{ sort: 'relevance', page: 1 }}
          className="border-primary bg-primary/20 text-tiny text-primary hover:bg-primary/30 rounded border px-4 py-2"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}

function RootNotFoundComponent() {
  return (
    <div className="border-border bg-surface-card space-y-4 rounded-md border p-8 text-center font-mono">
      <h1 className="text-display text-coral font-bold">404</h1>
      <p className="text-body text-text-secondary">Página não encontrada</p>
      <div>
        <Link
          to="/"
          search={{ sort: 'relevance', page: 1 }}
          className="border-primary bg-primary/20 text-tiny text-primary hover:bg-primary/30 inline-block rounded border px-4 py-2"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
