import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useCart } from "@/features/cart/cart-context";
import { Header } from "@/features/home/components/Header";
import { TrustSection } from "@/features/home/components/TrustSection";
import { Footer } from "@/features/home/components/Footer";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { RecommendedNfts } from "@/features/cart/components/RecommendedNfts";

export function CartPage() {
  const { items, total, removeItem, updateQuantity } = useCart();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#1a110d] font-mono text-zinc-100">
      {/* Desktop Header (>= lg) */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile Top Bar (< lg) */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
        <Link
          to="/"
          aria-label="Voltar para o início"
          className="flex size-9 items-center justify-center rounded-full border border-[#3a2416] bg-[#1c120e] text-zinc-300 hover:text-[#d4893f] transition-colors shadow-sm"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
        <h1 className="text-sm font-bold text-zinc-100 flex-1 text-center pr-9">
          Carrinho de NFTs
        </h1>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 pt-2 lg:pt-6 pb-12 xl:px-0">
        {/* Desktop Breadcrumb (>= lg) */}
        <nav aria-label="Breadcrumb" className="hidden lg:block text-[11px] text-zinc-100 mb-4">
          <ol className="flex items-center gap-1">
            <li>
              <Link to="/" className="hover:text-[#d4893f]">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" className="hover:text-[#d4893f]">
                Mercado
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Carrinho</li>
          </ol>
        </nav>

        {items.length === 0 ? (
          <div className="my-16 rounded-2xl lg:rounded-sm bg-[#241612] border border-[#3a2416] p-8 text-center text-xs text-zinc-400">
            <p className="text-sm font-bold text-zinc-200">Carrinho vazio.</p>
            <p className="mt-2 text-zinc-400">
              Você não adicionou nenhum item ao seu carrinho ainda.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-full lg:rounded-sm bg-[#d4893f] px-6 py-2.5 text-xs font-medium text-[#1a110d] hover:bg-[#e09a52]"
            >
              Continuar explorando
            </Link>
          </div>
        ) : (
          <div className="mt-2 lg:mt-4 grid grid-cols-1 items-start gap-4 lg:gap-10 lg:grid-cols-[1fr_360px]">
            {/* Left Column: Cart items */}
            <section aria-label="Itens do carrinho" className="min-w-0">
              <div className="hidden grid-cols-[1fr_90px_100px_90px_36px] items-center gap-3 px-4 pb-2 text-[11px] font-bold text-zinc-100 lg:grid">
                <span>NFTs</span>
                <span>Preço</span>
                <span className="text-center">Edições</span>
                <span>Total</span>
                <span className="sr-only">Ações</span>
              </div>

              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.nft.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </section>

            {/* Right Column: Wallet summary */}
            <CartSummary total={total} />
          </div>
        )}

        {/* Desktop Recommended NFTs Section (>= lg) */}
        <div className="hidden lg:block mt-20">
          <RecommendedNfts />
        </div>

        {/* Desktop Trust & Benefits Section (>= lg) */}
        <div className="hidden lg:block mt-24">
          <TrustSection />
        </div>
      </main>

      {/* Desktop Footer (>= lg) */}
      <div className="hidden lg:block mx-auto max-w-[1200px] px-4 pb-6 xl:px-0">
        <Footer />
      </div>
    </div>
  );
}