import { Link } from "@tanstack/react-router";
import { Home, Heart, ShoppingCart, User, Layers } from "lucide-react";
import { useCart } from "@/features/cart/cart-context";

interface MobileBottomNavProps {
  activeTab?: "home" | "wishlist" | "explore" | "cart" | "profile";
}

export function MobileBottomNav({ activeTab = "home" }: MobileBottomNavProps) {
  const { itemCount } = useCart();

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="fixed bottom-0 inset-x-0 z-40 block lg:hidden"
    >
      <div className="relative mx-auto max-w-md px-4 pb-3">
        {/* Nav Container */}
        <div className="relative flex h-16 items-center justify-between rounded-full border border-[#3a2416] bg-[#1c120e]/95 px-6 shadow-2xl backdrop-blur-md">
          {/* Home */}
          <Link
            to="/"
            aria-label="Página inicial"
            aria-current={activeTab === "home" ? "page" : undefined}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "home" ? "text-[#f5eee9]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Home className="size-5 fill-current" aria-hidden="true" />
            <span className="sr-only">Início</span>
          </Link>

          {/* Favoritos / Lista de interesse */}
          <button
            type="button"
            aria-label="Lista de interesse"
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "wishlist" ? "text-[#d4893f]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Heart className="size-5" aria-hidden="true" />
            <span className="sr-only">Favoritos</span>
          </button>

          {/* Center Action Button (Elevated) */}
          <div className="relative -mt-6">
            <button
              type="button"
              aria-label="Explorar destaque"
              className="flex size-13 items-center justify-center rounded-full border-4 border-[#140d0a] bg-gradient-to-tr from-[#9e5d28] to-[#d4893f] text-[#140d0a] shadow-xl hover:scale-105 transition-transform"
            >
              <Layers className="size-6 text-[#140d0a]" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          {/* Carrinho */}
          <Link
            to="/cart"
            aria-label={`Carrinho com ${itemCount} itens`}
            className={`relative flex flex-col items-center justify-center transition-colors ${
              activeTab === "cart" ? "text-[#d4893f]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ShoppingCart className="size-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-[#d4893f] text-[9px] font-bold text-[#1a110d]">
                {itemCount}
              </span>
            )}
            <span className="sr-only">Carrinho</span>
          </Link>

          {/* Perfil */}
          <Link
            to="/login"
            aria-label="Meu perfil ou entrar"
            className={`flex flex-col items-center justify-center transition-colors ${
              activeTab === "profile" ? "text-[#d4893f]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <User className="size-5" aria-hidden="true" />
            <span className="sr-only">Perfil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
