import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import type { Order } from "@/contracts/order";
import type { CartItem } from "@/features/cart/types";

type ExtendedOrder = Order & {
  purchasedItems?: CartItem[];
  selectedWallet?: string;
};

interface OrderConfirmationCardProps {
  order: ExtendedOrder;
}

function formatTx(tx: string) {
  if (tx.startsWith("tx-")) {
    const hex = tx.replace("tx-", "");
    return `0x${hex.slice(0, 4).toUpperCase()}...${hex.slice(-4).toUpperCase()}`;
  }
  if (tx.length <= 14) return tx;
  return `${tx.slice(0, 6)}...${tx.slice(-4)}`;
}

function formatDate(isoDate: string) {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "29 Jul, 2026";
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  } catch {
    return "29 Jul, 2026";
  }
}

function formatTokenId(id: string) {
  const digits = id.replace(/\D/g, "");
  return `#${digits.padStart(4, "0")}`;
}

function getWalletName(walletId?: string) {
  if (walletId === "coinbase") return "Coinbase";
  if (walletId === "walletconnect") return "WalletConnect";
  return "MetaMask";
}

export function OrderConfirmationCard({ order }: OrderConfirmationCardProps) {
  const items = order.purchasedItems ?? [];
  const walletName = getWalletName(order.selectedWallet);

  return (
    <div className="relative w-full max-w-[540px] rounded-sm border border-[#3a2416] bg-[#241612] p-8 font-mono text-zinc-100 shadow-2xl">
      {/* Close button */}
      <Link
        to="/"
        aria-label="Fechar e voltar ao marketplace"
        className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <X className="size-4" aria-hidden="true" />
      </Link>

      {/* Thank you envelope illustration */}
      <div className="mb-3 flex justify-center">
        <svg
          width="54"
          height="54"
          viewBox="0 0 54 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#d4893f]"
          aria-hidden="true"
        >
          {/* Note sticking out */}
          <rect
            x="14"
            y="6"
            width="26"
            height="22"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <text
            x="27"
            y="14"
            textAnchor="middle"
            fill="currentColor"
            fontSize="5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            THANK
          </text>
          <text
            x="27"
            y="21"
            textAnchor="middle"
            fill="currentColor"
            fontSize="5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            YOU
          </text>
          {/* Envelope body */}
          <rect
            x="8"
            y="18"
            width="38"
            height="27"
            rx="1"
            fill="#241612"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8 18L27 33L46 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 45L23 30" stroke="currentColor" strokeWidth="1.5" />
          <path d="M46 45L31 30" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Main message */}
      <div role={order.status === "rejected" ? "alert" : "status"} aria-atomic="true">
        <h1 className="text-center text-xs font-medium text-zinc-200">
          {order.status === "pending"
            ? "Seu pedido está sendo processado"
            : order.status === "rejected"
              ? "Seu pedido foi recusado"
              : "Seus NFTs agora estão na sua carteira"}
        </h1>
      </div>

      {/* Metadata bar */}
      <div className="my-5 grid grid-cols-4 border-y border-[#3a2416] py-3 text-center text-[10px]">
        <div className="border-r border-[#3a2416] px-1">
          <p className="text-[9px] text-zinc-400">ID da transação</p>
          <p className="mt-1 truncate font-bold text-zinc-100" title={order.transactionId}>
            {order.status === "confirmed"
              ? formatTx(order.transactionId)
              : order.status === "pending" ? "Aguardando confirmação" : "Não emitida"}
          </p>
        </div>
        <div className="border-r border-[#3a2416] px-1">
          <p className="text-[9px] text-zinc-400">Data</p>
          <p className="mt-1 font-bold text-zinc-100">{formatDate(order.createdAt)}</p>
        </div>
        <div className="border-r border-[#3a2416] px-1">
          <p className="text-[9px] text-zinc-400">Total</p>
          <p className="mt-1 font-bold text-[#d4893f]">{order.total} ETH</p>
        </div>
        <div className="px-1">
          <p className="text-[9px] text-zinc-400">Carteira</p>
          <p className="mt-1 font-bold text-zinc-100">{walletName}</p>
        </div>
      </div>

      {/* Detalhes da transação */}
      <div className="mt-4">
        <h2 className="mb-2 text-[11px] font-bold text-zinc-200">
          Detalhes da transação
        </h2>

        {/* Table header */}
        <div className="flex items-center justify-between border-b border-[#3a2416] pb-1.5 text-[10px] font-bold text-zinc-400">
          <span>NFTs</span>
          <div className="flex items-center gap-10">
            <span>Edições</span>
            <span>Subtotal</span>
          </div>
        </div>

        {/* Items rows if available */}
        {items.length > 0 && (
          <div className="my-3 space-y-2.5">
            {items.map((item) => (
              <div
                key={item.nft.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.nft.imageUrl}
                    alt={item.nft.name}
                    className="size-11 shrink-0 rounded-sm object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-zinc-100 text-xs">
                      {item.nft.name}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      ID do token: {formatTokenId(item.nft.id)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-10 shrink-0">
                  <span className="text-zinc-400 text-xs">(x {item.quantity})</span>
                  <span className="font-bold text-[#d4893f] text-xs">
                    {(Number(item.nft.price) * item.quantity).toFixed(2)} ETH
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="mt-3 space-y-1.5 pt-2 text-xs">
          <div className="flex justify-end gap-6 text-[11px] text-zinc-400">
            <span>Taxa de rede</span>
            <span className="text-zinc-200">0.016 ETH</span>
          </div>
          <div className="flex justify-end gap-6 pt-1 text-xs font-bold">
            <span className="text-zinc-100">Total</span>
            <span className="text-[#d4893f]">{order.total} ETH</span>
          </div>
        </div>

        {/* Confirmation text */}
        <p className="mx-auto mt-6 max-w-[400px] text-center text-[10px] leading-relaxed text-zinc-400">
          {order.status === "pending"
            ? "Aguardando a confirmação do pagamento. Seus itens permanecem no carrinho. Esta página será atualizada automaticamente."
            : order.status === "rejected"
              ? "O pagamento foi recusado. Seus itens permanecem no carrinho para uma nova tentativa."
              : "Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede."}
        </p>

        {/* Visual Etherscan Button */}
        {order.status === "confirmed" && (
          <div className="mt-5 text-center">
            <button
              type="button"
              className="rounded-sm bg-[#d4893f] px-6 py-2 text-xs font-bold text-[#1a110d] transition-colors hover:bg-[#e09a52]"
            >
              Ver no Etherscan
            </button>
          </div>
        )}
      </div>

      {/* Bottom orange accent border */}
      <div className="absolute right-0 bottom-0 left-0 h-1 rounded-b-sm bg-[#d4893f]" />
    </div>
  );
}
