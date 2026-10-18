import { Search, ShoppingCart, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/auth-context";
import { useCart } from "@/features/cart/cart-context";

const navItems = [
  { label: "Início", hash: "" },
  { label: "Mercado", hash: "catalog-section" },
  { label: "Criadores", hash: "criadores" },
  { label: "Aprenda", hash: "aprenda" },
];

export function Header() {
  const { itemCount } = useCart();

  const {
      user,
      isAuthenticated,
      logout,
    } = useAuth();
  return (
    <header className="border-b border-[#2e1d16] bg-[#140d0a]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto] items-center gap-y-2 px-4 py-3 lg:h-14 lg:grid-cols-[1fr_auto_1fr] lg:gap-y-0 lg:py-0 xl:px-0">
        <Link to="/" hash="" resetScroll className="text-sm font-bold tracking-widest text-zinc-100">
          KURIO
        </Link>

        <nav aria-label="Navegação principal" className="order-last col-span-2 min-w-0 lg:order-none lg:col-span-1">
          <ul className="flex items-center justify-between gap-3 text-xs sm:gap-8 lg:justify-start">
            {navItems.map((item, index) => (
              <li key={item.label}>
                <Link
                  to="/"
                  hash={item.hash}
                  resetScroll
                  hashScrollIntoView={{ behavior: "instant", block: "start" }}
                  aria-current={index === 0 ? "page" : undefined}
                  className={
                    index === 0
                      ? "border-b border-[#d4893f] pb-1 text-[#d4893f]"
                      : "text-zinc-300 hover:text-zinc-100"
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-2 lg:gap-4">
          <button type="button" aria-label="Buscar" className="text-zinc-300 hover:text-zinc-100">
            <Search className="size-4" aria-hidden="true" />
          </button>
          <Link
              to="/cart"
              aria-label={`Carrinho com ${itemCount} item(ns)`}
              className="relative inline-flex items-center justify-center text-zinc-300 hover:text-zinc-100"
            >
              <ShoppingCart className="size-4" aria-hidden="true" />

              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[#d4893f] px-1 text-[9px] font-bold text-[#1a110d]">
                  {itemCount}
                </span>
              )}
          </Link>
              {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                aria-label={user?.name ?? "Meu perfil"}
                className="inline-flex min-h-9 min-w-9 items-center justify-center text-xs text-zinc-100 hover:text-[#d4893f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4893f] lg:min-w-0"
              >
                <User className="size-4 lg:hidden" aria-hidden="true" />
                <span className="hidden lg:inline">{user?.name}</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="rounded-sm border border-[#d4893f] bg-[#d4893f] px-3 py-1 text-xs font-medium text-[#1a110d] hover:bg-[#e09a52]"
              >
                Sair
              </button>
            </div>
          ) : (
          <Link
            to="/login"
            className="rounded-sm border border-[#d4893f] bg-[#d4893f] px-3 py-1 text-xs font-medium text-[#1a110d] hover:bg-[#e09a52]"
          >
            Entrar
          </Link>
        )}
        </div>
      </div>
    </header>
  );
}
