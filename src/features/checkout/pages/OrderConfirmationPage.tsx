import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/features/cart/cart-context";
import { readLastOrder, useOrder } from "@/features/checkout/queries";
import { OrderConfirmationCard } from "@/features/checkout/components/OrderConfirmationCard";

export function OrderConfirmationPage() {
  const [receipt] = useState(readLastOrder);
  const { data: order, isError, refetch } = useOrder(receipt?.id);
  const { clearCart } = useCart();
  const clearedOrderId = useRef<string | null>(null);

  useEffect(() => {
    if (!order || !receipt || order.status === "pending") return;
    if (sessionStorage.getItem("kurio-checkout-idempotency-key") === order.idempotencyKey) {
      sessionStorage.removeItem("kurio-checkout-idempotency-key");
    }
    if (order.status !== "confirmed" || clearedOrderId.current === order.id) return;
    if (readLastOrder()?.cartCleared) return;

    clearedOrderId.current = order.id;
    sessionStorage.setItem("lastOrder", JSON.stringify({ ...receipt, cartCleared: true }));
    clearCart();
  }, [order, receipt, clearCart]);

  if (!receipt) {
    return (
      <main className="min-h-screen bg-[#140d0a] font-mono text-zinc-100 flex items-center justify-center p-4">
        <div className="rounded-sm border border-[#3a2416] bg-[#241612] p-8 text-center text-xs text-zinc-400 max-w-sm w-full">
          <h1 className="text-sm font-bold text-zinc-200">
            Nenhum pedido encontrado.
          </h1>
          <p className="mt-2 text-zinc-400">
            Não há registro recente de compra finalizada nesta sessão.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-sm bg-[#d4893f] px-6 py-2 text-xs font-medium text-[#1a110d] hover:bg-[#e09a52]"
          >
            Voltar ao marketplace
          </Link>
        </div>
      </main>
    );
  }

  if (!order || isError) {
    return (
      <main className="min-h-screen bg-[#140d0a] font-mono text-zinc-100 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[540px] rounded-sm border border-[#3a2416] bg-[#241612] p-8 text-center text-xs text-zinc-400">
          <p role={isError ? "alert" : "status"}>
            {isError ? "Não foi possível consultar o pedido. Seu carrinho foi preservado." : "Consultando o estado do pedido..."}
          </p>
          {isError && (
            <button type="button" onClick={() => void refetch()} className="mt-4 text-[#d4893f] hover:underline">
              Tentar novamente
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#140d0a] font-mono text-zinc-100 flex items-center justify-center p-4 sm:p-8">
      <OrderConfirmationCard order={{ ...order, purchasedItems: receipt.purchasedItems, selectedWallet: receipt.selectedWallet }} />
    </main>
  );
}
