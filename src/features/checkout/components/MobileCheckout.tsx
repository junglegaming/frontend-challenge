import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, MoreVertical, Wallet } from "lucide-react";

interface MobileCheckoutProps {
  finalTotal: number;
  selectedWallet: string;
  onSelectWallet: (wallet: string) => void;
  onConfirmOrder: () => void;
  isPending: boolean;
  isError: boolean;
}

export function MobileCheckout({
  finalTotal,
  selectedWallet,
  onSelectWallet,
  onConfirmOrder,
  isPending,
  isError,
}: MobileCheckoutProps) {
  const [connectedWalletMode, setConnectedWalletMode] = useState<"reserva" | "principal">("reserva");

  return (
    <div className="block lg:hidden min-h-screen bg-[#140d0a] text-zinc-100 font-mono px-4 pt-4 pb-10">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3">
        <Link
          to="/cart"
          aria-label="Voltar para o carrinho"
          className="flex size-9 items-center justify-center rounded-full border border-[#3a2416] bg-[#1c120e] text-zinc-300 hover:text-[#d4893f] transition-colors shadow-sm"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
        <h1 className="text-sm font-bold text-zinc-100 flex-1 text-center pr-9">
          Pagamento com carteira
        </h1>
      </div>

      {/* Seção: Carteira conectada */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-zinc-100">
            Carteira conectada
          </h2>
          <button
            type="button"
            onClick={() => setConnectedWalletMode(connectedWalletMode === "reserva" ? "principal" : "reserva")}
            className="text-xs font-medium text-[#d4893f] hover:underline cursor-pointer"
          >
            Trocar carteira
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Card 1: Reserva */}
          <div
            role="radio"
            aria-checked={connectedWalletMode === "reserva"}
            tabIndex={0}
            onClick={() => setConnectedWalletMode("reserva")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") setConnectedWalletMode("reserva");
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-[#241612] border border-[#3a2416] p-4 text-left cursor-pointer transition-colors hover:border-[#d4893f]/60"
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`flex size-4.5 items-center justify-center rounded-full border ${
                  connectedWalletMode === "reserva" ? "border-[#d4893f]" : "border-zinc-600"
                } shrink-0`}
                aria-hidden="true"
              >
                {connectedWalletMode === "reserva" && (
                  <span className="size-2 rounded-full bg-[#d4893f]" />
                )}
              </span>

              <div>
                <p className="font-bold text-xs text-zinc-100">Reserva</p>
                <p className="text-[11px] text-[#cfb7a5] mt-0.5">nova.kurio.eth</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Rede Polygon</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Opções da carteira Reserva"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-zinc-400 hover:text-zinc-200 p-1"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* Card 2: Principal */}
          <div
            role="radio"
            aria-checked={connectedWalletMode === "principal"}
            tabIndex={0}
            onClick={() => setConnectedWalletMode("principal")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") setConnectedWalletMode("principal");
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-[#241612] border border-[#3a2416] p-4 text-left cursor-pointer transition-colors hover:border-[#d4893f]/60"
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`flex size-4.5 items-center justify-center rounded-full border ${
                  connectedWalletMode === "principal" ? "border-[#d4893f]" : "border-zinc-600"
                } shrink-0`}
                aria-hidden="true"
              >
                {connectedWalletMode === "principal" && (
                  <span className="size-2 rounded-full bg-[#d4893f]" />
                )}
              </span>

              <div>
                <p className="font-bold text-xs text-zinc-100">Principal</p>
                <p className="text-[11px] text-[#cfb7a5] mt-0.5">0xA91F...E82C</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Rede principal Ethereum</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Opções da carteira Principal"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-zinc-400 hover:text-zinc-200 p-1"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Seção: Carteira e rede */}
      <div className="mt-6">
        <h2 className="text-xs font-bold text-zinc-100 mb-3">
          Carteira e rede
        </h2>

        <div className="space-y-2.5">
          {/* Option 1: WalletConnect */}
          <div
            role="radio"
            aria-checked={selectedWallet === "walletconnect" || selectedWallet === "multi"}
            tabIndex={0}
            onClick={() => onSelectWallet("walletconnect")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") onSelectWallet("walletconnect");
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-[#241612] border border-[#3a2416] p-4 text-left cursor-pointer transition-colors hover:border-[#d4893f]/60"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#1c120e] border border-[#3a2416] text-xs font-bold text-[#d4893f]">
                W
              </span>
              <span className="text-xs font-medium text-zinc-200">WalletConnect</span>
            </div>

            <span
              className={`flex size-4.5 items-center justify-center rounded-full border ${
                selectedWallet === "walletconnect" ? "border-[#d4893f]" : "border-zinc-600"
              } shrink-0`}
              aria-hidden="true"
            >
              {selectedWallet === "walletconnect" && (
                <span className="size-2 rounded-full bg-[#d4893f]" />
              )}
            </span>
          </div>

          {/* Option 2: MetaMask */}
          <div
            role="radio"
            aria-checked={selectedWallet === "metamask"}
            tabIndex={0}
            onClick={() => onSelectWallet("metamask")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") onSelectWallet("metamask");
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-[#241612] border border-[#3a2416] p-4 text-left cursor-pointer transition-colors hover:border-[#d4893f]/60"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#1c120e] border border-[#3a2416] text-xs font-bold text-[#d4893f]">
                M
              </span>
              <span className="text-xs font-medium text-zinc-200">MetaMask</span>
            </div>

            <span
              className={`flex size-4.5 items-center justify-center rounded-full border ${
                selectedWallet === "metamask" ? "border-[#d4893f]" : "border-zinc-600"
              } shrink-0`}
              aria-hidden="true"
            >
              {selectedWallet === "metamask" && (
                <span className="size-2 rounded-full bg-[#d4893f]" />
              )}
            </span>
          </div>

          {/* Option 3: Coinbase Wallet (Selected in Figma) */}
          <div
            role="radio"
            aria-checked={selectedWallet === "coinbase"}
            tabIndex={0}
            onClick={() => onSelectWallet("coinbase")}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") onSelectWallet("coinbase");
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-[#241612] border border-[#3a2416] p-4 text-left cursor-pointer transition-colors hover:border-[#d4893f]/60"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#1c120e] border border-[#3a2416] text-xs font-bold text-[#d4893f]">
                <Wallet className="size-4 text-[#d4893f]" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-zinc-200">Coinbase Wallet</span>
            </div>

            <span
              className={`flex size-4.5 items-center justify-center rounded-full border ${
                selectedWallet === "coinbase" ? "border-[#d4893f]" : "border-zinc-600"
              } shrink-0`}
              aria-hidden="true"
            >
              {selectedWallet === "coinbase" && (
                <span className="size-2 rounded-full bg-[#d4893f]" />
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Total */}
      <div className="flex items-center justify-end gap-3 mt-8 text-xs font-bold font-mono">
        <span className="text-zinc-100">Total:</span>
        <span className="text-base text-[#d4893f]">{finalTotal.toFixed(3)} ETH</span>
      </div>

      {/* Confirm purchase button */}
      <button
        type="button"
        onClick={onConfirmOrder}
        disabled={isPending}
        className="mt-6 w-full rounded-full bg-[#c88243] hover:bg-[#d4893f] py-4 text-center font-bold text-xs sm:text-sm text-[#140d0a] shadow-xl transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "Processando..." : "Confirmar compra"}
      </button>

      {/* Error feedback */}
      {isError && (
        <p role="alert" className="mt-3 text-center text-xs text-red-400">
          Não foi possível confirmar o pedido.
        </p>
      )}
    </div>
  );
}
