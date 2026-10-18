import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/features/cart/cart-context";
import { useCreateOrder } from "@/features/checkout/mutations";
import { Header } from "@/features/home/components/Header";
import { TrustSection } from "@/features/home/components/TrustSection";
import { Footer } from "@/features/home/components/Footer";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { CheckoutSummary } from "@/features/checkout/components/CheckoutSummary";
import { MobileCheckout } from "@/features/checkout/components/MobileCheckout";

const NETWORK_FEE = 0.016;

export function CheckoutPage() {
  const { items, total } = useCart();
  const navigate = useNavigate();
  const createOrderMutation = useCreateOrder();

  const [idempotencyKey] = useState(() => {
    const existing = sessionStorage.getItem("kurio-checkout-idempotency-key");
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem("kurio-checkout-idempotency-key", key);
    return key;
  });
  const [selectedWallet, setSelectedWallet] = useState("coinbase");

  if (items.length === 0) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#1a110d] font-mono text-zinc-100">
        <div className="hidden lg:block">
          <Header />
        </div>
        <main className="mx-auto max-w-[1200px] px-4 pt-6 xl:px-0">
          <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-100">
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
              <li aria-current="page">Pagamento</li>
            </ol>
          </nav>

          <div className="my-16 rounded-2xl lg:rounded-sm bg-[#241612] border border-[#3a2416] p-8 text-center text-xs text-zinc-400">
            <p className="text-sm font-bold text-zinc-200">Seu carrinho está vazio.</p>
            <p className="mt-2 text-zinc-400">
              Adicione itens ao carrinho antes de prosseguir para o pagamento.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-full lg:rounded-sm bg-[#d4893f] px-6 py-2.5 text-xs font-medium text-[#1a110d] hover:bg-[#e09a52]"
            >
              Voltar ao marketplace
            </Link>
          </div>

          <div className="hidden lg:block mt-24">
            <TrustSection />
          </div>
        </main>

        <div className="hidden lg:block mx-auto max-w-[1200px] px-4 pb-6 xl:px-0">
          <Footer />
        </div>
      </div>
    );
  }

  const finalTotal = Number((total + NETWORK_FEE).toFixed(3));

  function handleConfirmOrder() {
    if (createOrderMutation.isPending) return;
    createOrderMutation.mutate(
      {
        items: items.map((item) => ({
          nftId: item.nft.id,
          quantity: item.quantity,
        })),
        total: finalTotal,
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          sessionStorage.setItem(
            "lastOrder",
            JSON.stringify({
              id: order.id,
              purchasedItems: items,
              selectedWallet,
              cartCleared: false,
            }),
          );

          navigate({
            to: "/order-confirmation",
          });
        },
      },
    );
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleConfirmOrder();
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#1a110d] font-mono text-zinc-100">
      {/* Mobile Checkout View (< lg) */}
      <MobileCheckout
        finalTotal={finalTotal}
        selectedWallet={selectedWallet}
        onSelectWallet={setSelectedWallet}
        onConfirmOrder={handleConfirmOrder}
        isPending={createOrderMutation.isPending}
        isError={createOrderMutation.isError}
      />

      {/* Desktop Checkout View (>= lg) */}
      <div className="hidden lg:block">
        <Header />

        <main className="mx-auto max-w-[1200px] px-4 pt-6 xl:px-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-100 mb-4">
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
              <li aria-current="page">Pagamento</li>
            </ol>
          </nav>

          {/* 2 columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
            {/* Left: Perfil do colecionador */}
            <div className="min-w-0">
              <CheckoutForm formId="checkout-form" onSubmit={handleFormSubmit} />
            </div>

            {/* Right: Seus NFTs and Wallet */}
            <CheckoutSummary
              items={items}
              total={total}
              networkFee={NETWORK_FEE}
              finalTotal={finalTotal}
              selectedWallet={selectedWallet}
              onSelectWallet={setSelectedWallet}
              isPending={createOrderMutation.isPending}
              isError={createOrderMutation.isError}
              formId="checkout-form"
            />
          </div>

          {/* Trust & Newsletter section */}
          <div className="mt-24">
            <TrustSection />
          </div>
        </main>

        {/* Footer */}
        <div className="mx-auto max-w-[1200px] px-4 pb-6 xl:px-0">
          <Footer />
        </div>
      </div>
    </div>
  );
}
