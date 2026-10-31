import type { useCart } from "@/features/market/context/cart-provider";
import { useCart as useCartContext } from "@/features/market/context/cart-provider";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, Mail, X } from "lucide-react";

type CartItemData = ReturnType<typeof useCart>["items"][number];

interface CheckoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemData[];
  total: number;
  transactionHash?: string;
  walletAddress?: string;
}

const NETWORK_FEE = 0.016;

export function CheckoutSuccessModal({
  isOpen,
  onClose,
  items,
  total,
  transactionHash,
  walletAddress,
}: CheckoutSuccessModalProps) {
  const navigate = useNavigate();
  const { clearCart } = useCartContext();

  if (!isOpen) return null;

  const handleComplete = () => {
    clearCart();
    onClose();
    navigate({ to: "/market" });
  };

  const shortHash = transactionHash
    ? `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`
    : "Não informado";

  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "MetaMask";

  const etherscanUrl = transactionHash
    ? `https://etherscan.io/tx/${transactionHash}`
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-success-title"
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#523326] bg-[#241611] font-sans text-[#f5eee9] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="relative border-b border-[#523326] px-4 pb-4 pt-5 text-center sm:px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="absolute right-2 top-2 rounded-lg p-1.5 text-[#d9904b] transition-colors hover:bg-[#3a251b] sm:right-3 sm:top-3"
          >
            <X size={18} />
          </button>

          <Mail
            size={52}
            strokeWidth={1.4}
            className="mx-auto text-[#d9904b]"
          />

          <h2
            id="checkout-success-title"
            className="mt-3 text-base font-semibold tracking-tight text-[#d2b797] sm:text-lg"
          >
            Seus NFTs agora estão na sua carteira
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-[#523326] px-4 py-3 sm:grid-cols-4 sm:gap-0 sm:px-5">
          <div className="min-w-0 sm:border-r sm:border-[#d9904b] sm:pr-2">
            <p className="text-xs font-semibold text-[#d2b797]">
              ID da transação
            </p>
            <p
              className="truncate text-xs text-[#bca68b] sm:text-sm"
              title={transactionHash}
            >
              {shortHash}
            </p>
          </div>

          <div className="min-w-0 sm:border-r sm:border-[#d9904b] sm:px-2">
            <p className="text-xs text-[#bca68b]">Data</p>
            <p className="text-xs text-[#d2b797] sm:text-sm">
              {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </p>
          </div>

          <div className="min-w-0 sm:border-r sm:border-[#d9904b] sm:px-2">
            <p className="text-xs text-[#bca68b]">Total</p>
            <p className="text-xs tabular-nums text-[#d2b797] sm:text-sm">
              {total.toFixed(3)} ETH
            </p>
          </div>

          <div className="min-w-0 sm:pl-2">
            <p className="text-xs font-semibold text-[#d2b797]">Carteira</p>
            <p
              className="truncate text-xs text-[#bca68b] sm:text-sm"
              title={walletAddress}
            >
              {shortWallet}
            </p>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <h3 className="mb-3 text-sm font-semibold tracking-tight">
            Detalhes da transação
          </h3>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 border-b border-[#523326] pb-2 text-xs font-semibold sm:gap-4 sm:text-sm">
            <span>NFTs</span>
            <span>Edições</span>
            <span>Subtotal</span>
          </div>

          <div className="space-y-3 py-3">
            {items.map((item) => {
              const subtotal = item.nft.price * item.quantity;

              return (
                <div
                  key={`${item.nft.id}-${item.edition}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <img
                      src={item.nft.image}
                      alt={item.nft.name}
                      className="size-12 shrink-0 rounded-xl object-cover sm:size-14"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold tracking-tight sm:text-sm">
                        {item.nft.name}
                      </p>
                      <p className="truncate text-xs leading-relaxed text-[#bca68b]">
                        ID do token: #{item.nft.tokenId}
                      </p>
                    </div>
                  </div>

                  <span className="whitespace-nowrap text-xs tabular-nums text-[#bca68b]">
                    (x {item.quantity})
                  </span>

                  <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-[#d9904b] sm:text-sm">
                    {subtotal.toFixed(3)} ETH
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-b border-[#523326] pb-3 pt-1">
            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="text-[#d2b797]">Taxa de rede</span>
              <span className="whitespace-nowrap tabular-nums">
                {NETWORK_FEE.toFixed(3)} ETH
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span>Total</span>
              <span className="whitespace-nowrap tabular-nums text-[#d9904b]">
                {total.toFixed(3)} ETH
              </span>
            </div>
          </div>

          <p className="px-2 py-3 text-center text-xs leading-relaxed text-[#bca68b] sm:text-sm">
            {transactionHash
              ? "Confira os detalhes da transação na rede Ethereum. A confirmação e o registro dos NFTs podem levar alguns instantes."
              : "Sua compra foi processada. Os detalhes da transação estarão disponíveis quando o identificador for informado."}
          </p>

          {etherscanUrl ? (
            <a
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto flex w-fit items-center justify-center gap-2 rounded-xl bg-[#d9904b] px-4 py-2.5 text-sm font-semibold text-[#241611] transition-colors hover:bg-[#e5a565]"
            >
              Ver no Etherscan
              <ExternalLink size={15} />
            </a>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="mx-auto block rounded-xl bg-[#d9904b] px-5 py-2.5 text-sm font-semibold text-[#241611] transition-colors hover:bg-[#e5a565]"
            >
              Concluir
            </button>
          )}
        </div>

        <div className="h-1.5 bg-[#d9904b]" />
      </div>
    </div>
  );
}
