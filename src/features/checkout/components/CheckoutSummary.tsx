import type { CartItem } from "@/features/cart/types";

interface CheckoutSummaryProps {
  items: CartItem[];
  total: number;
  networkFee: number;
  finalTotal: number;
  selectedWallet: string;
  onSelectWallet: (wallet: string) => void;
  isPending: boolean;
  isError: boolean;
  formId: string;
}

function formatTokenId(id: string) {
  const digits = id.replace(/\D/g, "");
  return `#${digits.padStart(4, "0")}`;
}

export function CheckoutSummary({
  items,
  total,
  networkFee,
  finalTotal,
  selectedWallet,
  onSelectWallet,
  isPending,
  isError,
  formId,
}: CheckoutSummaryProps) {
  return (
    <aside aria-labelledby="order-summary-title" className="text-xs">
      <h2 id="order-summary-title" className="text-xs font-bold text-zinc-100 mb-2">
        Seus NFTs
      </h2>

      {/* Table Header */}
      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-300 px-1 pb-2">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>

      {/* Items list */}
      <div className="space-y-2 mb-3">
        {items.map((item) => (
          <article
            key={item.nft.id}
            aria-label={item.nft.name}
            className="flex items-center justify-between bg-[#241612] p-2.5 rounded-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={item.nft.imageUrl}
                alt={item.nft.name}
                className="size-11 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0">
                <h3 className="truncate font-bold text-zinc-100 text-xs">{item.nft.name}</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  ID do token: {formatTokenId(item.nft.id)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-zinc-400 text-xs">(x {item.quantity})</span>
              <span className="font-bold text-[#d4893f] text-xs">
                {(Number(item.nft.price) * item.quantity).toFixed(2)} ETH
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Promo link */}
      <p className="text-center text-[11px] text-zinc-300 py-1">
        Tem um código promocional?{" "}
        <button type="button" className="text-[#d4893f] hover:underline">
          Aplique aqui
        </button>
      </p>

      {/* Breakdown */}
      <dl className="mt-3 space-y-2 text-xs text-zinc-300 border-t border-[#3a2416] pt-3">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="font-medium text-zinc-100">{total.toFixed(2)} ETH</dd>
        </div>
        <div className="flex justify-between">
          <dt>Desconto do lançamento</dt>
          <dd className="font-medium text-zinc-100">(-) 00.00</dd>
        </div>
        <div>
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd className="font-medium text-zinc-100">{networkFee.toFixed(3)} ETH</dd>
          </div>
          <p className="mt-0.5 text-right text-[9px] text-[#d4893f]">Taxa estimada</p>
        </div>
      </dl>

      {/* Total */}
      <div className="mt-3 flex items-baseline justify-between border-t border-[#3a2416] pt-3">
        <span className="text-xs font-bold text-zinc-100">Total</span>
        <span className="text-sm font-bold text-[#d4893f]">
          {finalTotal.toFixed(3)} ETH
        </span>
      </div>

      {/* Carteira e rede */}
      <div className="mt-5">
        <h3 className="text-center text-xs font-bold text-zinc-100 mb-3">
          Carteira e rede
        </h3>

        <div className="space-y-2">
          {/* Option 1: Multi wallets */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedWallet === "multi"}
            onClick={() => onSelectWallet("multi")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-sm border ${
              selectedWallet === "multi"
                ? "border-[#d4893f] bg-[#1a110d]"
                : "border-[#3a2416] bg-[#140d0a] hover:border-zinc-600"
            } transition-colors text-left`}
          >
            <span
              className={`size-3.5 rounded-full border ${
                selectedWallet === "multi" ? "border-[#d4893f]" : "border-zinc-500"
              } flex items-center justify-center shrink-0`}
              aria-hidden="true"
            >
              {selectedWallet === "multi" && (
                <span className="size-1.5 rounded-full bg-[#d4893f]" />
              )}
            </span>
            <span className="bg-[#241612] px-2 py-0.5 text-[8px] font-bold text-[#d4893f] tracking-wider rounded-none">
              METAMASK • WALLETCONNECT • COINBASE
            </span>
          </button>

          {/* Option 2: MetaMask */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedWallet === "metamask"}
            onClick={() => onSelectWallet("metamask")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-sm border ${
              selectedWallet === "metamask"
                ? "border-[#d4893f] bg-[#1a110d]"
                : "border-[#3a2416] bg-[#140d0a] hover:border-zinc-600"
            } transition-colors text-left`}
          >
            <span
              className={`size-3.5 rounded-full border ${
                selectedWallet === "metamask" ? "border-[#d4893f]" : "border-zinc-500"
              } flex items-center justify-center shrink-0`}
              aria-hidden="true"
            >
              {selectedWallet === "metamask" && (
                <span className="size-1.5 rounded-full bg-[#d4893f]" />
              )}
            </span>
            <span className="text-xs text-zinc-100 font-medium">MetaMask</span>
          </button>

          {/* Option 3: Coinbase Wallet */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedWallet === "coinbase"}
            onClick={() => onSelectWallet("coinbase")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-sm border ${
              selectedWallet === "coinbase"
                ? "border-[#d4893f] bg-[#1a110d]"
                : "border-[#3a2416] bg-[#140d0a] hover:border-zinc-600"
            } transition-colors text-left`}
          >
            <span
              className={`size-3.5 rounded-full border ${
                selectedWallet === "coinbase" ? "border-[#d4893f]" : "border-zinc-500"
              } flex items-center justify-center shrink-0`}
              aria-hidden="true"
            >
              {selectedWallet === "coinbase" && (
                <span className="size-1.5 rounded-full bg-[#d4893f]" />
              )}
            </span>
            <span className="text-xs text-zinc-100 font-medium">Coinbase Wallet</span>
          </button>
        </div>
      </div>

      {/* Confirm button */}
      <button
        type="submit"
        form={formId}
        disabled={isPending}
        className="mt-5 w-full bg-[#d4893f] hover:bg-[#e09a52] text-[#1a110d] font-bold py-2.5 text-xs rounded-sm transition-colors disabled:opacity-50"
      >
        {isPending ? "Processando..." : "Confirmar compra"}
      </button>

      {/* Error feedback */}
      {isError && (
        <p role="alert" className="mt-2 text-center text-xs text-red-400">
          Não foi possível confirmar o pedido.
        </p>
      )}
    </aside>
  );
}
