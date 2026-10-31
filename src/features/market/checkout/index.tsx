import { useSession } from "@/features/auth/hooks/use-session";
import { useCart } from "@/features/market/context/cart-provider";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckoutForm } from "./components/checkout-form";
import { CheckoutSummary } from "./components/checkout-summary";

export function MarketCheckout() {
  const { items, subtotal } = useCart();
  const { data: session, isLoading } = useSession();

  const [useAnotherWallet, setUseAnotherWallet] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(
      "Os dados foram preenchidos. A finalização da compra ainda não está disponível.",
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Carregando dados da sessão...
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 text-xs text-muted">
        <span>Início</span> / <span>Mercado</span> /{" "}
        <span className="text-foreground">Pagamento</span>
      </p>

      {items.length === 0 ? (
        <div className="rounded-card border border-border bg-surface-raised px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-foreground">
            Seu carrinho está vazio
          </h2>

          <p className="mt-2 text-sm text-muted">
            Adicione NFTs ao carrinho antes de continuar para o pagamento.
          </p>

          <Link
            to="/market"
            search={{ view: "market" }}
            className="mt-5 inline-flex rounded-control bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Explorar mercado
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
            <CheckoutForm
              user={session?.user ?? null}
              useAnotherWallet={useAnotherWallet}
              onUseAnotherWalletChange={setUseAnotherWallet}
            />

            <CheckoutSummary items={items} subtotal={subtotal} />
          </div>

          {message && (
            <p role="status" className="mt-4 text-sm text-primary">
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
