import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { Heart, ScanLine, ShoppingCart, UserRound } from 'lucide-react';
import { useSession } from '@/lib/session/state';
import { openAuth } from '@/features/auth/navigation';
import { locationHref } from '@/lib/session/guards';

const catalogRoute = getRouteApi('/');

export function MobileNavigation() {
  const router = useRouter();
  const { session } = useSession();
  const filters = catalogRoute.useSearch();
  const navigate = catalogRoute.useNavigate();
  const favoritesOnly = !!filters.favoritesOnly;

  function toggleFavorites(trigger: HTMLElement) {
    if (!session) {
      const destination = new URL(
        locationHref(router.state.location),
        window.location.origin
      );
      destination.searchParams.delete('auth');
      destination.searchParams.delete('redirect');
      destination.searchParams.set('favoritesOnly', 'true');
      destination.searchParams.set('page', '1');
      void openAuth(
        router,
        'login',
        destination.pathname + destination.search + '#catalogo',
        trigger
      );
      return;
    }
    void navigate({
      search: (previous) => ({
        ...previous,
        favoritesOnly: favoritesOnly ? undefined : true,
        page: 1,
      }),
      hash: 'catalogo',
    });
  }

  return (
    <nav aria-label="Navegação mobile" className="mobile-nav md:hidden">
      <svg
        className="mobile-nav-background"
        viewBox="0 0 390 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 90V28Q0 0 28 0H135C155 0 152 46 195 46S235 0 255 0H362Q390 0 390 28V90Z" />
      </svg>
      <div className="mobile-nav-items">
        <Link
          from="/"
          to="/"
          search={(previous) => ({
            ...previous,
            favoritesOnly: undefined,
            page: 1,
          })}
          hash="catalogo"
          aria-label="Início"
          aria-current={!favoritesOnly ? 'page' : undefined}
          className="mobile-nav-action"
        >
          <span className="mobile-nav-home" aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-label="Favoritos"
          aria-pressed={favoritesOnly}
          data-auth-trigger={!session || undefined}
          className="mobile-nav-action"
          onClick={(event) => toggleFavorites(event.currentTarget)}
        >
          <Heart aria-hidden="true" fill="currentColor" />
        </button>
        {session ? (
          <Link
            to="/wallets"
            aria-label="Carteiras"
            className="mobile-nav-scan"
          >
            <ScanLine aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Carteiras"
            data-auth-trigger
            className="mobile-nav-scan"
            onClick={(event) =>
              void openAuth(router, 'login', '/wallets', event.currentTarget)
            }
          >
            <ScanLine aria-hidden="true" />
          </button>
        )}
        <Link to="/cart" aria-label="Carrinho" className="mobile-nav-action">
          <ShoppingCart aria-hidden="true" fill="currentColor" />
        </Link>
        {session ? (
          <Link to="/profile" aria-label="Perfil" className="mobile-nav-action">
            <UserRound aria-hidden="true" fill="currentColor" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Perfil"
            data-auth-trigger
            className="mobile-nav-action"
            onClick={(event) =>
              void openAuth(router, 'login', '/profile', event.currentTarget)
            }
          >
            <UserRound aria-hidden="true" fill="currentColor" />
          </button>
        )}
      </div>
    </nav>
  );
}
