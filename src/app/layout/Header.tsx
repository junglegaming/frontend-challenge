import { Link } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart, User } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'

export interface HeaderProps {
  /** Number of units in the cart, shown as a badge. Omit/0 hides the badge. */
  cartCount?: number
  /** Signed-in collector, or null for a visitor. */
  user?: { name: string; avatarUrl: string | null } | null
}

/**
 * Site header, reused by every page via the root route layout.
 * Purely presentational: data (cart count, session) is injected by the caller.
 * Routes not implemented yet are rendered disabled rather than as dead links
 * (the challenge requires no action to *look* functional before it is).
 */
export function Header({ cartCount = 0, user = null }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="NFT Marketplace, página inicial"
          className="flex items-center gap-2 rounded-md text-lg font-bold tracking-tight"
        >
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            N
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            NFT Marketplace
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-2 hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/" activeProps={{ 'aria-current': 'page', className: 'bg-accent/40' }}>
              Início
            </Link>
          </Button>
          <DisabledNavItem label="Criadores" />
          <DisabledNavItem label="Aprenda" />
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Buscar NFTs" disabled aria-disabled="true" title="Busque na página inicial">
            <Search aria-hidden="true" />
          </Button>

          <Button variant="ghost" size="icon" className="relative" aria-label={`Carrinho${cartCount > 0 ? `, ${cartCount} item(ns)` : ''}`} disabled aria-disabled="true" title="Em breve">
            <ShoppingCart aria-hidden="true" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full',
                  'bg-primary px-1 text-[10px] font-semibold text-primary-foreground',
                )}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Button>

          {user ? (
            <Button variant="ghost" size="icon" aria-label={`Conta de ${user.name}`} disabled aria-disabled="true" title="Em breve">
              <User aria-hidden="true" />
            </Button>
          ) : (
            <Button size="sm" className="gap-2" disabled aria-disabled="true" title="Em breve">
              <LogIn className="size-4" aria-hidden="true" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

function DisabledNavItem({ label }: { label: string }) {
  return (
    <Button variant="ghost" size="sm" disabled aria-disabled="true" title="Em breve">
      {label}
    </Button>
  )
}
