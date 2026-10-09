import { Logo } from '../shared/Logo';
import { HeaderNav } from '../shared/HeaderNav';
import { ActiveLink } from '../ui/active-link';
import { cn } from 'cn';
import { HeaderActions } from '../shared/HeaderActions';
import { useCartCount } from '@/features/cart/hooks/useCartCount';

type HeaderSectionHref = `#${string}` | `/#${string}`;

interface HeaderProps {
  marketHref?: HeaderSectionHref;
  learnHref?: HeaderSectionHref;
  creatorsHref?: HeaderSectionHref;
  divider?: boolean;
}

function sectionLink(href: HeaderSectionHref) {
  return {
    to: href.startsWith('/') ? ('/' as const) : ('.' as const),
    hash: href.slice(href.indexOf('#') + 1),
    search: true as const,
    activeOptions: { includeHash: true },
  };
}

export function Header({
  marketHref = '/#catalogo',
  learnHref = '/#diario',
  creatorsHref = '#criadores',
  divider = false,
}: HeaderProps) {
  const cartCount = useCartCount();

  return (
    <header
      className={cn(
        'catalog-header mb-8 hidden h-11.25 items-start justify-between md:flex',
        divider && 'border-border border-b'
      )}
    >
      <Logo />
      <HeaderNav aria-label="Navegação principal">
        <ActiveLink
          to="/"
          search={{ sort: 'relevance', page: 1 }}
          activeOptions={{ exact: true, includeHash: true }}
          className="text-primary"
        >
          Início
        </ActiveLink>
        <ActiveLink {...sectionLink(marketHref)}>Mercado</ActiveLink>
        <ActiveLink {...sectionLink(creatorsHref)}>
          Criadores{/* TODO: Verificar para onde vai esse link */}
        </ActiveLink>
        <ActiveLink {...sectionLink(learnHref)}>
          Aprenda{/* TODO: Verificar para onde vai esse link */}
        </ActiveLink>
      </HeaderNav>
      <HeaderActions cartCount={cartCount} />
    </header>
  );
}
