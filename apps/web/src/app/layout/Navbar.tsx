import { Link } from '@tanstack/react-router'
import { CartIcon, LoginIcon, ProfileIcon, SearchIcon, iconProps } from '@/shared/icons'
import { CountBadge } from '@/shared/ui/count-badge'
import { NavLink } from '@/shared/ui/nav-link'
import { Button } from '@/shared/ui/button'
import type { UserRole } from '@/domains/auth'
import { navbarItems, visibleFor } from './nav-items'

export interface NavbarProps {
  /** Number of units in the cart, shown as a badge. Omit/0 hides the badge. */
  cartCount?: number
  /** Signed-in collector, or null for a visitor. */
  user?: { name: string; avatarUrl: string | null; role: UserRole } | null
}

/**
 * The one site navbar, rendered by the root layout for every page.
 * Purely presentational: cart count and session are injected by the caller.
 * Below `md` only logo + essential actions stay here; the main destinations move to the Dock.
 */
export function Navbar({ cartCount = 0, user = null }: NavbarProps) {
  const items = visibleFor(navbarItems, user?.role)
  // A fifth destination (administrators) no longer fits at `md` with the wide gap: tighten it until `lg`.
  const gap = items.length > navbarItems.filter((item) => !item.requiresRole).length ? 'gap-6 lg:gap-10' : 'gap-10'
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-4 md:px-6">
        <Link
          to="/"
          aria-label="Kurio, página inicial"
          className="rounded-sm text-action font-bold tracking-widest focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          KURIO
        </Link>

        <nav aria-label="Principal" className={`mx-auto hidden items-center ${gap} md:flex`}>
          {items.map((item) => (
            <NavLink key={item.id} to={item.enabled ? item.to : null}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" aria-label="Buscar NFTs" aria-disabled="true" title="Busque na página inicial">
            <SearchIcon {...iconProps} size={20} />
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart" aria-label={`Carrinho${cartCount > 0 ? `, ${cartCount} item(ns)` : ''}`}>
              <CartIcon {...iconProps} size={20} />
              <CountBadge count={cartCount} className="absolute -right-0.5 -top-0.5" />
            </Link>
          </Button>

          {user ? (
            <Button asChild variant="ghost" size="icon">
              <Link to="/account/profile" aria-label={`Conta de ${user.name}`}>
                <ProfileIcon {...iconProps} size={20} />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">
                <LoginIcon {...iconProps} />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
