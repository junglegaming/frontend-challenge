import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Gamepad2,
  Gem,
  Grid2X2,
  LogIn,
  Music2,
  Palette,
  ShoppingCart,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

interface MobileHeaderActionsProps {
  totalItems: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onOpenAuth: () => void;
}

const categories = [
  { label: "Todas as coleções", slug: "all", icon: Grid2X2 },
  { label: "Arte", slug: "art", icon: Palette },
  { label: "Música", slug: "music", icon: Music2 },
  { label: "Games", slug: "games", icon: Gamepad2 },
  { label: "Esportes", slug: "sports", icon: Trophy },
  { label: "Colecionáveis", slug: "collectibles", icon: Gem },
];

export function MobileHeaderActions({
  totalItems,
  isAuthenticated,
  isLoading,
  isMenuOpen,
  onMenuToggle,
  onOpenAuth,
}: MobileHeaderActionsProps) {
  function closeMenu() {
    if (isMenuOpen) {
      onMenuToggle();
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-navigation"
        onClick={onMenuToggle}
        className="rounded-control p-2 text-foreground transition-colors hover:bg-surface-raised md:hidden"
      >
        {isMenuOpen ? <X className="size-5" /> : <Grid2X2 className="size-5" />}
      </button>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMenu();
            }
          }}
        >
          <aside
            id="mobile-navigation"
            aria-label="Menu principal"
            className="absolute right-0 top-0 flex h-[100dvh] w-[min(85%,360px)] flex-col overflow-y-auto border-l border-[#59301f] bg-[#241510] text-[#eee5df] shadow-2xl"
          >
            <div className="flex-1 space-y-6 px-5 py-6">
              <section>
                <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a98265]">
                  Minha conta
                </p>

                {!isLoading &&
                  (isAuthenticated ? (
                    <Link
                      to="/"
                      onClick={closeMenu}
                      className="flex items-center justify-between rounded-lg bg-[#382319] p-4 transition-colors hover:bg-[#493020]"
                    >
                      <span className="flex items-center gap-3 font-mono text-sm">
                        <UserRound className="size-5 text-[#e99a54]" />
                        Meu perfil
                      </span>

                      <ChevronRight className="size-4 text-[#a98265]" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="flex w-full items-center justify-between rounded-lg bg-[#d9904b] p-4 font-mono text-sm font-bold text-[#1c110d] transition-colors hover:bg-[#eda45f]"
                    >
                      <span className="flex items-center gap-3">
                        <LogIn className="size-5" />
                        Entrar ou criar conta
                      </span>

                      <ChevronRight className="size-4" />
                    </button>
                  ))}
              </section>

              <section>
                <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a98265]">
                  Navegação
                </p>

                <div className="space-y-1">
                  <Link
                    to="/market"
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-lg px-3 py-3 font-mono text-sm transition-colors hover:bg-[#382319]"
                  >
                    <span className="flex items-center gap-3">
                      <Grid2X2 className="size-5 text-[#e99a54]" />
                      Explorar coleções
                    </span>

                    <ChevronRight className="size-4 text-[#a98265]" />
                  </Link>

                  <Link
                    to="/market"
                    search={{ view: "cart" }}
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-lg px-3 py-3 font-mono text-sm transition-colors hover:bg-[#382319]"
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart className="size-5 text-[#e99a54]" />
                      Meu carrinho
                    </span>

                    <span className="flex items-center gap-2">
                      {totalItems > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-[#d9904b] text-[10px] font-bold text-[#1c110d]">
                          {totalItems > 99 ? "99+" : totalItems}
                        </span>
                      )}

                      <ChevronRight className="size-4 text-[#a98265]" />
                    </span>
                  </Link>
                </div>
              </section>

              <section>
                <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a98265]">
                  Categorias
                </p>

                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;

                    return (
                      <Link
                        key={category.slug}
                        to="/market"
                        search={{ category: category.slug }}
                        onClick={closeMenu}
                        className="flex items-center justify-between rounded-lg px-3 py-3 font-mono text-sm transition-colors hover:bg-[#382319]"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="size-5 text-[#e99a54]" />
                          {category.label}
                        </span>

                        <ChevronRight className="size-4 text-[#a98265]" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="border-t border-[#59301f] px-5 py-4">
              <p className="text-center font-mono text-[10px] text-[#a98265]">
                Explore, descubra e colecione.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
