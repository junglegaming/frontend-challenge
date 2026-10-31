import { Link } from "@tanstack/react-router";

interface HeaderNavigationProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function HeaderNavigation({
  mobile = false,
  onNavigate,
}: HeaderNavigationProps) {
  if (mobile) {
    return (
      <nav
        id="mobile-navigation"
        aria-label="Navegação mobile"
        className="border-t border-border bg-background px-4 py-3 md:hidden"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-control px-3 py-3 text-sm text-foreground transition-colors hover:bg-surface-raised"
            onClick={onNavigate}
          >
            Início
          </Link>

          <Link
            to="/market"
            className="rounded-control px-3 py-3 text-sm text-foreground transition-colors hover:bg-surface-raised"
            onClick={onNavigate}
          >
            Mercado
          </Link>

          <span className="cursor-not-allowed rounded-control px-3 py-3 text-sm text-muted">
            Criadores
          </span>

          <span className="cursor-not-allowed rounded-control px-3 py-3 text-sm text-muted">
            Aprenda
          </span>

          <button
            type="button"
            className="mt-2 rounded-control bg-primary px-3 py-3 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={onNavigate}
          >
            Entrar
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden items-center gap-7 md:flex"
    >
      <Link
        to="/"
        activeOptions={{ exact: true }}
        activeProps={{ className: "border-primary text-primary" }}
        inactiveProps={{
          className: "border-transparent text-muted hover:text-foreground",
        }}
        className="flex min-h-16 items-center border-b-2 text-sm transition-colors"
      >
        Início
      </Link>

      <Link
        to="/market"
        activeProps={{ className: "border-primary text-primary" }}
        inactiveProps={{
          className: "border-transparent text-muted hover:text-foreground",
        }}
        className="flex min-h-16 items-center border-b-2 text-sm transition-colors"
      >
        Mercado
      </Link>

      <span className="flex min-h-16 cursor-not-allowed items-center border-b-2 border-transparent text-sm text-muted">
        Criadores
      </span>

      <span className="flex min-h-16 cursor-not-allowed items-center border-b-2 border-transparent text-sm text-muted">
        Aprenda
      </span>
    </nav>
  );
}
