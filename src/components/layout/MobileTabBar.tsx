import { Link, useLocation } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'

const item = 'grid size-12 place-items-center rounded-full text-muted-foreground transition-colors'

export function MobileTabBar() {
  const { pathname } = useLocation()
  const cart = useCart()
  const count = cart.data?.itemCount ?? 0
  // Detalhe, carrinho e pagamento têm barra de ação própria no rodapé (Figma mobile).
  if (/^\/(nft\/|cart|checkout)/.test(pathname)) return null

  return (
    <nav aria-label="Navegação" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="relative mx-auto flex h-[88px] max-w-[480px] items-center justify-around rounded-t-[32px] bg-card px-4 pb-2">
        <Link to="/" aria-label="Início" aria-current={pathname === '/' ? 'page' : undefined} className={cn(item, pathname === '/' && 'text-primary')}>
          <Home aria-hidden="true" />
        </Link>
        <Link to="/profile" aria-label="Favoritos e perfil" className={item}>
          <Heart aria-hidden="true" />
        </Link>
        <Link
          to="/"
          hash="busca"
          aria-label="Buscar NFTs"
          className="-mt-14 grid size-16 place-items-center rounded-full bg-gradient-to-b from-primary to-[#b46d34] text-primary-foreground shadow-lg shadow-black/40"
        >
          <ScanLine aria-hidden="true" />
        </Link>
        <Link to="/cart" aria-label={`Carrinho, ${count} itens`} aria-current={pathname === '/cart' ? 'page' : undefined} className={cn(item, 'relative', pathname === '/cart' && 'text-primary')}>
          <ShoppingCart aria-hidden="true" />
          {count > 0 && (
            <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" aria-hidden="true">
              {count}
            </span>
          )}
        </Link>
        <Link to="/profile" aria-label="Perfil" aria-current={pathname === '/profile' ? 'page' : undefined} className={cn(item, pathname === '/profile' && 'text-primary')}>
          <User aria-hidden="true" />
        </Link>
      </div>
    </nav>
  )
}
