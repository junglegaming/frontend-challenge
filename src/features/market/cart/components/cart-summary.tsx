import { Link } from "@tanstack/react-router";

interface CartSummaryProps {
  subtotal: number;
  onCheckout: () => void;
  isLoading: boolean;
}

const NETWORK_FEE = 0.016;

export function CartSummary({
  subtotal,
  onCheckout,
  isLoading,
}: CartSummaryProps) {
  const total = subtotal + NETWORK_FEE;

  return (
    <aside className="h-fit">
      <h2 className="border-b border-border pb-2 text-lg font-bold text-foreground">
        Resumo da carteira
      </h2>

      <div className="mt-5">
        <label
          htmlFor="promo-code"
          className="text-xs font-semibold text-foreground"
        >
          Código promocional
        </label>

        <div className="mt-2 flex h-10 w-full overflow-hidden rounded-control border border-primary transition-colors focus-within:ring-1 focus-within:ring-primary">
          <input
            id="promo-code"
            type="text"
            placeholder="Digite o código promocional..."
            className="min-w-0 flex-1 border-0 bg-transparent px-2 text-[10px] text-foreground outline-none placeholder:text-[10px] placeholder:text-muted focus-visible:ring-0"
          />

          <button
            type="button"
            className="shrink-0 bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Aplicar
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-3 text-muted">
          <span>Subtotal</span>
          <span className="text-foreground">{subtotal.toFixed(3)} ETH</span>
        </div>

        <div className="flex justify-between gap-3 text-muted">
          <span>Desconto do lançamento</span>
          <span className="text-foreground">(-) 00.00</span>
        </div>

        <div className="flex justify-between gap-3 text-muted">
          <span>Taxa de rede</span>
          <span className="text-foreground">{NETWORK_FEE.toFixed(3)} ETH</span>
        </div>

        <p className="text-right text-xs text-primary">Taxa estimada</p>

        <div className="flex justify-between gap-3 border-t border-border pt-4 text-base font-bold">
          <span className="text-foreground">Total</span>
          <span className="text-primary">{total.toFixed(3)} ETH</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={isLoading}
        className="mt-5 w-full cursor-pointer rounded-control bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Verificando sessão..." : "Conectar e finalizar"}
      </button>

      <Link
        to="/market"
        search={{ view: "market" }}
        className="mt-3 block text-center text-sm text-primary transition-colors hover:text-primary-hover"
      >
        Continuar explorando
      </Link>
    </aside>
  );
}
