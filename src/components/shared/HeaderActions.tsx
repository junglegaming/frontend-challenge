import { Link } from '@tanstack/react-router';
import { AccountActions } from './AccountActions';
import SearchIcon from '@/assets/search.svg?react';
import CartIcon from '@/assets/cart.svg?react';
import { IconBadge } from '../ui/icon-badge';

export function HeaderActions({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <div className="flex items-center gap-7">
      {/* @ts-expect-error TODO: Verificar para onde vai esse link */}
      <Link to="/search" aria-label="Buscar">
        <SearchIcon aria-hidden="true" />
      </Link>
      <Link
        to="/cart"
        className="flex items-center justify-center"
        aria-label={
          cartCount > 0
            ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`
            : 'Carrinho'
        }
      >
        <IconBadge count={cartCount}>
          <CartIcon aria-hidden="true" />
        </IconBadge>
      </Link>
      <AccountActions />
    </div>
  );
}
