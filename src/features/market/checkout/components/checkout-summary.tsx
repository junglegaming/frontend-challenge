import { walletService } from "@/features/account/components/wallet/wallet.service";
import type { useCart } from "@/features/market/context/cart-provider";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckoutSuccessModal } from "./checkout-success-modal";

type CartItemData = ReturnType<typeof useCart>["items"][number];

interface CheckoutSummaryProps {
  items: CartItemData[];
  subtotal: number;
}

const NETWORK_FEE = 0.016;

const walletOptions = [
  { value: "wallet-connect", label: "WalletConnect" },
  { value: "metamask", label: "MetaMask" },
  { value: "coinbase", label: "Coinbase Wallet" }
];

export function CheckoutSummary({ items, subtotal }: CheckoutSummaryProps) {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [walletError, setWalletError] = useState("");

  const {
    data,
    isLoading: isLoadingWallets,
    isError: isWalletError,
  } = useQuery({
    queryKey: ["wallets"],
    queryFn: walletService.findAll,
  });

  const primaryWallet = data?.wallets.find(
    (wallet) => wallet.role === "primary",
  );

  const total = subtotal + NETWORK_FEE;

  const handleCheckout = () => {
    setWalletError("");

    if (isWalletError) {
      setWalletError(
        "Não foi possível verificar suas carteiras. Tente novamente.",
      );
      return;
    }

    if (!primaryWallet?.walletAddress.trim()) {
      setWalletError(
        "Você precisa cadastrar uma carteira antes de realizar a compra.",
      );
      return;
    }

    setIsSuccessOpen(true);
  };

  return (
    <>
      <aside className="h-fit min-w-0">
        <h2 className="text-base font-bold text-foreground">Seus NFTs</h2>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] border-b border-border pb-2 text-sm font-semibold text-foreground">
          <span>NFTs</span>
          <span>Subtotal</span>
        </div>

        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div
              key={`${item.nft.id}-${item.edition}`}
              className="flex min-w-0 items-center gap-2 bg-surface-raised p-1"
            >
              <img
                src={item.nft.image}
                alt={item.nft.name}
                className="size-[70px] shrink-0 rounded-control object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {item.nft.name}
                </p>

                <p className="text-xs text-muted">
                  ID do token: #{item.nft.tokenId}
                </p>
              </div>

              <span className="shrink-0 text-xs text-muted">
                (x {item.quantity})
              </span>

              <span className="shrink-0 text-sm font-bold text-primary">
                {(item.nft.price * item.quantity).toFixed(2)} ETH
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <p className="mt-3 text-center text-xs text-muted">
            Tem um código promocional?{" "}
            <span className="font-semibold text-primary">Aplique aqui.</span>
          </p>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3 text-muted">
            <span>Subtotal</span>
            <span className="text-foreground">{subtotal.toFixed(2)} ETH</span>
          </div>

          <div className="flex justify-between gap-3 text-muted">
            <span>Desconto do lançamento</span>
            <span className="text-foreground">(-) 00.00</span>
          </div>

          <div className="flex justify-between gap-3 text-muted">
            <span>Taxa de rede</span>
            <span className="text-foreground">
              {NETWORK_FEE.toFixed(3)} ETH
            </span>
          </div>

          <p className="text-right text-xs text-primary">Taxa estimada</p>

          <div className="flex justify-between gap-3 border-t border-border pt-2 text-base font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">{total.toFixed(3)} ETH</span>
          </div>
        </div>

        <div className="mt-2">
          <h3 className="mb-3 text-center text-base font-bold text-foreground">
            Carteira e rede
          </h3>

          <div className="space-y-3">
            {walletOptions.map((option) => {
              const isSelected = primaryWallet?.walletType === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex cursor-not-allowed items-center gap-3 rounded-control border px-3 py-3 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkout-wallet"
                    value={option.value}
                    checked={isSelected}
                    readOnly
                    className="size-4 accent-primary"
                  />

                  {option.label}
                </label>
              );
            })}
          </div>
        </div>

        {walletError && (
          <p className="mt-3 text-center text-xs text-red-400">{walletError}</p>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isLoadingWallets || isWalletError || items.length === 0}
          className="mt-6 w-full cursor-pointer rounded-control bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoadingWallets ? "Verificando carteira..." : "Confirmar compra"}
        </button>

        <Link
          to="/market"
          search={{ view: "cart" }}
          className="mt-3 block text-center text-xs text-muted transition-colors hover:text-primary"
        >
          Voltar ao carrinho
        </Link>
      </aside>

      <CheckoutSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        items={items}
        total={total}
      />
    </>
  );
}
