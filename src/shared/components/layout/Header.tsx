import { useRef, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link, useRouterState } from '@tanstack/react-router'

import { LogIn, Menu, Search, ShoppingCart, X } from 'lucide-react'

import { sessionQueryOptions, useLogout } from '@/features/auth/api'
import { cartQueryOptions } from '@/features/cart/api'
import { DEFAULT_NFT_LIST_QUERY } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { useBodyScrollLock } from '@/shared/lib/useBodyScrollLock'

/** Seções planejadas, mas fora do escopo do desafio: renderizadas como "em breve". */
const COMING_SOON_SECTIONS = ['Criadores', 'Aprenda'] as const

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const comingSoonLinkClass = cn(
  'inline-flex h-[45px] cursor-not-allowed items-center border-b-[3px] border-transparent font-mono text-[16px] leading-[21px] font-normal text-foreground/80 hover:text-highlight',
  focusRing,
)

const iconButtonClass = cn(
  'relative inline-flex size-9 items-center justify-center rounded-[5px] text-foreground transition-colors hover:text-primary',
  focusRing,
)

/** Props de {@link Header}. */
interface HeaderProps {
  /** Quantidade de itens no carrinho exibida no contador. */
  cartItemCount?: number
}

/**
 * Header global do Kurio: logo, navegação principal e ações (busca, entrar,
 * carrinho). Abaixo de `md`, a navegação vai para um menu modal acessível.
 *
 * @param props - {@link HeaderProps}
 * @returns Elemento `header` da aplicação.
 * @example
 * <Header cartItemCount={cartItems.length} />
 */
export function Header({ cartItemCount }: HeaderProps) {
  const menuDialogRef = useRef<HTMLDialogElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  useBodyScrollLock(isMenuOpen)

  const session = useQuery(sessionQueryOptions())
  const cartQuery = useQuery(cartQueryOptions())
  const logout = useLogout()
  const user = session.data?.user
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const isHome =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/cadastro' ||
    pathname === '/perfil' ||
    pathname === '/carteiras'
  const isMarket = !isHome
  const isMarketScreen =
    pathname.startsWith('/nft') ||
    pathname === '/carrinho' ||
    pathname === '/pagamento' ||
    pathname.startsWith('/pedido')
  const showDivider = !isMarketScreen

  const totalCartCount =
    cartItemCount ?? cartQuery.data?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0

  const cartLabel = totalCartCount === 1 ? 'Carrinho, 1 item' : `Carrinho, ${totalCartCount} itens`

  function openMenu() {
    setIsMenuOpen(true)
    menuDialogRef.current?.showModal()
  }

  function closeMenu() {
    setIsMenuOpen(false)
    menuDialogRef.current?.close()
  }

  function restoreFocusToTrigger() {
    setIsMenuOpen(false)
    menuTriggerRef.current?.focus()
  }

  return (
    <header
      className={cn(
        'bg-background text-foreground pt-6',
        (pathname === '/' ||
          pathname.startsWith('/nft/') ||
          pathname === '/carrinho' ||
          pathname === '/pagamento' ||
          pathname === '/login' ||
          pathname === '/cadastro') &&
          'hidden md:block',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-[45px] w-full max-w-[1200px] items-start justify-between px-4 sm:px-6 xl:px-0',
          showDivider && 'border-b border-[#D28A4C]/30',
        )}
      >
        <div className="flex h-[45px] w-auto items-start pt-[8px] lg:w-[160px]">
          <Link
            to="/"
            search={DEFAULT_NFT_LIST_QUERY}
            className={cn(
              'rounded-[3px] font-mono text-[14px] leading-[18px] font-bold tracking-[0.1em] text-foreground transition-colors hover:text-primary',
              focusRing,
            )}
            aria-label="Kurio, página inicial"
          >
            KURIO
          </Link>
        </div>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex h-[45px] items-start gap-6 lg:gap-10">
            <li className="h-[45px]">
              <Link
                to="/"
                search={DEFAULT_NFT_LIST_QUERY}
                className={cn(
                  'flex h-[45px] flex-col justify-between font-mono text-[16px] leading-[21px] transition-colors',
                  isHome
                    ? 'font-bold text-highlight'
                    : 'font-normal text-foreground hover:text-highlight',
                  focusRing,
                )}
              >
                <span>Início</span>
                {isHome && (
                  <span aria-hidden="true" className="w-full border-b-[3px] border-primary" />
                )}
              </Link>
            </li>
            <li>
              <Link
                to="/"
                search={DEFAULT_NFT_LIST_QUERY}
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault()
                    document
                      .getElementById('catalogo-section')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className={cn(
                  'flex h-[45px] flex-col justify-between font-mono text-[16px] leading-[21px] transition-colors',
                  isMarket
                    ? 'font-bold text-highlight'
                    : 'font-normal text-foreground hover:text-highlight',
                  focusRing,
                )}
              >
                <span>Mercado</span>
                {isMarket && (
                  <span aria-hidden="true" className="w-full border-b-[3px] border-primary" />
                )}
              </Link>
            </li>
            {COMING_SOON_SECTIONS.map((section) => (
              <li key={section} className="h-[45px]">
                <a
                  href="#"
                  aria-disabled="true"
                  title={`${section} — em breve`}
                  onClick={(event) => event.preventDefault()}
                  className={cn(
                    'inline-flex font-mono text-[16px] leading-[21px] font-normal text-foreground hover:text-highlight cursor-not-allowed',
                    focusRing,
                  )}
                >
                  {section}
                  <span className="sr-only"> (em breve)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex h-[35px] items-center justify-end gap-2 md:gap-4 xl:w-[207px] xl:gap-7">
          <button
            type="button"
            aria-label="Buscar NFTs (em breve)"
            title="Busca — em breve"
            aria-disabled="true"
            className={cn(
              'inline-flex size-5 items-center justify-center text-foreground transition-colors duration-150 hover:text-primary cursor-not-allowed',
              focusRing,
            )}
          >
            <Search aria-hidden="true" className="size-5" strokeWidth={2.25} />
          </button>

          <Link
            to="/carrinho"
            aria-label={cartLabel}
            className={cn(
              'relative inline-flex items-center text-foreground transition-colors duration-150 hover:text-primary',
              focusRing,
            )}
          >
            <ShoppingCart aria-hidden="true" className="size-6" strokeWidth={2} />
            {totalCartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full border-2 border-ink bg-primary text-[10px] leading-[13px] font-medium text-ink shadow-sm"
              >
                {totalCartCount > 99 ? '99+' : totalCartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/carteiras"
                className={cn(
                  'font-mono text-sm text-foreground transition-colors hover:text-primary',
                  focusRing,
                )}
              >
                Carteiras
              </Link>
              <Link
                to="/perfil"
                className={cn(
                  'max-w-32 truncate font-mono text-sm text-foreground transition-colors hover:text-primary',
                  focusRing,
                )}
                title={user.name}
              >
                Perfil
                <span className="sr-only"> ({user.name})</span>
              </Link>
              <button
                type="button"
                onClick={() => logout.mutate()}
                className={cn(
                  'cursor-pointer rounded-[5px] border border-border px-3 py-1 font-mono text-sm text-foreground transition-colors duration-150 hover:border-error/60 hover:text-error',
                  focusRing,
                )}
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              search={{}}
              className={cn(
                'hidden h-[35px] w-[100px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] bg-primary font-mono text-[16px] leading-[21px] font-medium text-ink shadow-button transition-colors duration-150 hover:bg-highlight sm:inline-flex',
                focusRing,
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4M8 14l4-4-4-4M12 10H3" />
              </svg>
              Entrar
            </Link>
          )}

          <button
            ref={menuTriggerRef}
            type="button"
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            aria-controls="menu-mobile"
            onClick={openMenu}
            className={cn(iconButtonClass, 'md:hidden')}
          >
            <Menu aria-hidden="true" className="size-6" />
          </button>
        </div>
      </div>

      <dialog
        ref={menuDialogRef}
        id="menu-mobile"
        aria-label="Menu"
        onClose={restoreFocusToTrigger}
        onClick={(event) => {
          // Clique no backdrop chega com o próprio dialog como alvo.
          if (event.target === event.currentTarget) closeMenu()
        }}
        className="m-0 ml-auto h-dvh max-h-none w-[min(20rem,85vw)] max-w-none overscroll-contain bg-surface-card p-0 text-canvas shadow-option backdrop:bg-ink/70 md:hidden"
      >
        <div className="flex h-full flex-col gap-6 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-base font-bold tracking-widest text-primary">
              KURIO
            </span>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={closeMenu}
              className={iconButtonClass}
            >
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>

          <nav aria-label="Principal (mobile)">
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  to="/"
                  search={DEFAULT_NFT_LIST_QUERY}
                  onClick={closeMenu}
                  className={cn(
                    'inline-flex w-full items-center border-b-[2px] py-2.5 font-mono text-[16px] leading-[21px] transition-colors',
                    isHome
                      ? 'border-primary font-bold text-highlight'
                      : 'border-transparent font-normal text-foreground hover:text-highlight',
                    focusRing,
                  )}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  search={DEFAULT_NFT_LIST_QUERY}
                  onClick={(e) => {
                    closeMenu()
                    if (pathname === '/') {
                      e.preventDefault()
                      document
                        .getElementById('catalogo-section')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className={cn(
                    'inline-flex w-full items-center border-b-[2px] py-2.5 font-mono text-[16px] leading-[21px] transition-colors',
                    isMarket
                      ? 'border-primary font-bold text-highlight'
                      : 'border-transparent font-normal text-foreground hover:text-highlight',
                    focusRing,
                  )}
                >
                  Mercado
                </Link>
              </li>
              {COMING_SOON_SECTIONS.map((section) => (
                <li key={section}>
                  <a
                    href="#"
                    aria-disabled="true"
                    title={`${section} — em breve`}
                    onClick={(event) => event.preventDefault()}
                    className={cn(comingSoonLinkClass, 'w-full justify-between')}
                  >
                    {section}
                    <span className="text-xs">em breve</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {user ? (
            <button
              type="button"
              onClick={() => logout.mutate()}
              className={cn(
                'mt-auto inline-flex items-center justify-center gap-2 rounded-[5px] border border-surface-dark px-4 py-2.5 text-sm text-canvas',
                focusRing,
              )}
            >
              Sair
            </button>
          ) : (
            <Link
              to="/login"
              search={{}}
              className={cn(
                'mt-auto inline-flex items-center justify-center gap-2 rounded-[5px] bg-primary px-4 py-2.5 text-sm font-bold text-ink shadow-button transition-colors hover:bg-highlight',
                focusRing,
              )}
            >
              <LogIn aria-hidden="true" className="size-4" />
              Entrar
            </Link>
          )}
        </div>
      </dialog>
    </header>
  )
}
