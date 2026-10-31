import { useCart } from "@/features/market/context/cart-provider";
import { Link } from "@tanstack/react-router";
import { CartList } from "./components/cart-list";
import { CartSummary } from "./components/cart-summary";
import { useCartCheckout } from "./hooks/use-cart-checkout";

type CartItemData = ReturnType<typeof useCart>["items"][number];

export function MarketCart() {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart();

  const { handleCheckout, isLoading, authModal } = useCartCheckout();

  function handleUpdateQuantity(item: CartItemData, quantity: number) {
    updateQuantity(item.nft.id, item.edition, quantity);
  }

  function handleRemove(item: CartItemData) {
    removeFromCart(item.nft.id, item.edition);
  }

  return (
    <>
      <div>
        <p className="mb-5 text-xs text-muted">
          <span>Início</span> / <span>Mercado</span> /{" "}
          <span className="text-foreground">Carrinho</span>
        </p>

        {items.length === 0 ? (
          <div className="rounded-card border border-border bg-surface-raised px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-foreground">
              Seu carrinho está vazio
            </h2>

            <p className="mt-2 text-sm text-muted">
              Explore o mercado e adicione NFTs ao seu carrinho.
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
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
            <CartList
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
            />

            <CartSummary
              subtotal={subtotal}
              onCheckout={handleCheckout}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {authModal}
    </>
  );
}
