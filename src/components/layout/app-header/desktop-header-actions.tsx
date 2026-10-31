import { HeaderSearch } from "@/components/ui/header-search";
import { Link } from "@tanstack/react-router";
import { LogIn, ShoppingCart, UserRound } from "lucide-react";

interface DesktopHeaderActionsProps {
  totalItems: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  onOpenAuth: () => void;
}

export function DesktopHeaderActions({
  totalItems,
  isAuthenticated,
  isLoading,
  onOpenAuth,
}: DesktopHeaderActionsProps) {
  return (
    <>
      <HeaderSearch />

      <div className="hidden items-center gap-2 md:flex">
        <Link
          to="/market"
          search={{ view: "cart" }}
          aria-label={`Carrinho (${totalItems} itens)`}
          className="relative rounded-control p-2 text-foreground transition-colors hover:bg-surface-raised"
        >
          <ShoppingCart className="size-5" />

          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Link>

        {!isLoading &&
          (isAuthenticated ? (
            <Link
              to="/"
              className="ml-2 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <UserRound className="size-4" />
              Meu perfil
            </Link>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="ml-2 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover cursor-pointer"
            >
              <LogIn className="size-4" />
              Entrar
            </button>
          ))}
      </div>
    </>
  );
}
