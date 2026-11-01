import { useQuery } from '@tanstack/react-query'
import { Link, useRouterState } from '@tanstack/react-router'

import { Heart, Home, ShoppingCart, User } from 'lucide-react'

import { sessionQueryOptions } from '@/features/auth/api'
import { cartQueryOptions } from '@/features/cart/api'
import { DEFAULT_NFT_LIST_QUERY } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'

/**
 * Barra de navegação inferior mobile (Tab Bar) conforme a especificação do Figma:
 * - Fundo #241612 com recorte côncavo suave (scalloped notch) ao redor do botão central
 * - Botão flutuante central de 65px com gradiente #D28A4C e ícone retículo de 5 vetores
 * - 5 itens: Início (preenchido #E89B55), Favoritos (#CFB28C), Botão Central, Carrinho (#CFB28C) e Perfil (#CFB28C)
 */
export function MobileTabBar() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const session = useQuery(sessionQueryOptions())
  const cartQuery = useQuery(cartQueryOptions())
  const user = session.data?.user

  const totalCartCount = cartQuery.data?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0

  const isHome = pathname === '/'
  const isCart = pathname === '/carrinho'
  const isProfile =
    pathname === '/perfil' ||
    pathname === '/carteiras' ||
    pathname === '/login' ||
    pathname === '/cadastro'

  if (
    pathname.startsWith('/nft/') ||
    pathname === '/carrinho' ||
    pathname === '/pagamento' ||
    pathname === '/login' ||
    pathname === '/cadastro'
  ) {
    return null
  }

  return (
    <nav
      aria-label="Navegação móvel"
      className="fixed right-0 bottom-0 left-0 z-40 pointer-events-none md:hidden"
    >
      <div className="relative mx-auto flex h-[92px] w-full max-w-[414px] items-end justify-center">
        {/* Scalloped Notched Tab Bar SVG Background (#241612) */}
        <svg
          viewBox="0 0 414 95"
          preserveAspectRatio="none"
          className="pointer-events-auto absolute inset-0 size-full drop-shadow-[0px_-10px_30px_rgba(10,6,4,0.45)]"
          fill="none"
        >
          <path
            d="M 0,32 C 0,18 14,16 28,16 L 158,16 C 170,16 176,18 181,24 C 188,35 196,58 207,58 C 218,58 226,35 233,24 C 238,18 244,16 256,16 L 386,16 C 400,16 414,18 414,32 L 414,95 L 0,95 Z"
            fill="#241612"
          />
        </svg>

        {/* Center Floating Action Button (Ellipse 39: 65px circle) */}
        <div className="pointer-events-auto absolute top-[3px] left-1/2 z-10 -translate-x-1/2">
          <Link
            to="/"
            search={DEFAULT_NFT_LIST_QUERY}
            className="flex size-[65px] cursor-pointer items-center justify-center rounded-full shadow-[0px_4px_20px_rgba(210,138,76,0.5)] transition-transform active:scale-95"
            style={{
              background:
                'linear-gradient(180deg, rgba(210, 138, 76, 0.4) -16.92%, #D28A4C 109.23%)',
            }}
            aria-label="Kurio Explorar"
          >
            {/* 5-vector Reticle/Visor Icon matching Figma Vector Group */}
            <svg
              viewBox="0 0 28 28"
              className="size-[28px]"
              fill="none"
              stroke="#F5F1EB"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3.5" y1="14" x2="24.5" y2="14" strokeWidth="2.3" />
              <path d="M 10 7.5 L 8 7.5 C 5.8 7.5 4.8 9 5 11.5" />
              <path d="M 18 7.5 L 20 7.5 C 22.2 7.5 23.2 9 23 11.5" />
              <path d="M 10 20.5 L 8 20.5 C 5.8 20.5 4.8 19 5 16.5" />
              <path d="M 18 20.5 L 20 20.5 C 22.2 20.5 23.2 19 23 16.5" />
            </svg>
          </Link>
        </div>

        {/* Tab Items Row */}
        <div className="pointer-events-auto relative z-10 flex h-[62px] w-full items-center justify-between px-6 pb-2">
          {/* Home */}
          <Link
            to="/"
            search={DEFAULT_NFT_LIST_QUERY}
            className={cn(
              'flex size-11 items-center justify-center transition-colors',
              isHome ? 'text-[#E89B55]' : 'text-[#CFB28C] hover:text-[#E89B55]',
            )}
            aria-label="Início"
          >
            <Home
              className={cn('size-6 transition-colors', isHome && 'fill-current')}
              strokeWidth={isHome ? 2.5 : 2}
            />
          </Link>

          {/* Favoritos */}
          <button
            type="button"
            onClick={() => {
              if (pathname === '/') {
                document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className="flex size-11 cursor-pointer items-center justify-center text-[#CFB28C] transition-colors hover:text-[#E89B55]"
            aria-label="Favoritos"
          >
            <Heart className="size-6 fill-current" strokeWidth={2} />
          </button>

          {/* Spacer for center button */}
          <div className="size-[65px] shrink-0" aria-hidden="true" />

          {/* Carrinho / Shop */}
          <Link
            to="/carrinho"
            className={cn(
              'relative flex size-11 items-center justify-center transition-colors',
              isCart ? 'text-[#E89B55]' : 'text-[#CFB28C] hover:text-[#E89B55]',
            )}
            aria-label={`Carrinho com ${totalCartCount} itens`}
          >
            <ShoppingCart className="size-6" strokeWidth={isCart ? 2.5 : 2} />
            {totalCartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-ink"
              >
                {totalCartCount > 99 ? '99+' : totalCartCount}
              </span>
            )}
          </Link>

          {/* Perfil / User */}
          <Link
            to={user ? '/perfil' : '/login'}
            className={cn(
              'flex size-11 items-center justify-center transition-colors',
              isProfile ? 'text-[#E89B55]' : 'text-[#CFB28C] hover:text-[#E89B55]',
            )}
            aria-label={user ? 'Meu Perfil' : 'Entrar na conta'}
          >
            <User className="size-6 fill-current" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </nav>
  )
}
