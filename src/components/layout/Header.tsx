import { useRef, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart, User } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCart } from '@/hooks/useCart'
import { useLogout, useSession } from '@/hooks/useSession'
import { cn } from '@/lib/utils'
import { HeaderSearch } from './HeaderSearch'

const navLink = 'relative py-2 text-[15px] tracking-wide transition-colors hover:text-accent-text'
const activeLink = 'font-bold text-primary after:absolute after:inset-x-0 after:-bottom-[13px] after:h-0.5 after:bg-primary'

export function Header() {
  const { pathname } = useLocation()
  const { user } = useSession()
  const cart = useCart()
  const logout = useLogout()
  const itemCount = cart.data?.itemCount ?? 0
  const isMarket = pathname.startsWith('/nft') || pathname.startsWith('/cart') || pathname.startsWith('/checkout')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchButton = useRef<HTMLButtonElement>(null)

  const closeSearch = () => {
    setSearchOpen(false)
    searchButton.current?.focus()
  }

  return (
    <header className="hidden border-b border-border md:block">
      <div className="mx-auto flex h-[69px] max-w-[1200px] items-center justify-between px-6 xl:px-0">
        <Link to="/" className="text-sm font-bold tracking-[0.2em]" aria-label="Kurio, página inicial">
          KURIO
        </Link>

        {searchOpen ? (
          <HeaderSearch onClose={closeSearch} />
        ) : (
          <nav aria-label="Principal" className="flex items-center gap-10">
            <Link to="/" className={cn(navLink, pathname === '/' && activeLink)} aria-current={pathname === '/' ? 'page' : undefined}>
              Início
            </Link>
            <Link to="/" hash="catalogo" className={cn(navLink, isMarket && activeLink)} aria-current={isMarket ? 'page' : undefined}>
              Mercado
            </Link>
            <ComingSoon className={navLink}>Criadores</ComingSoon>
            <ComingSoon className={navLink}>Aprenda</ComingSoon>
          </nav>
        )}

        <div className="flex items-center gap-5">
          <button
            ref={searchButton}
            type="button"
            aria-label="Buscar"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
            className="rounded-sm p-1 hover:text-accent-text"
          >
            <Search className="size-6" aria-hidden="true" />
          </button>
          <Link to="/cart" className="relative rounded-sm p-1 hover:text-accent-text" aria-label={`Carrinho, ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}>
            <ShoppingCart className="size-6" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" aria-hidden="true">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label={`Conta de ${user.displayName}`}>
                  {user.avatar ? <img src={user.avatar} alt="" className="size-6 rounded-full object-cover" /> : <User aria-hidden="true" />}
                  <span className="max-w-32 truncate">{user.displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile">Meu perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallets">Carteiras</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout.mutate()}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="." search={(prev) => ({ ...prev, auth: 'login' as const })}>
                <LogIn aria-hidden="true" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
