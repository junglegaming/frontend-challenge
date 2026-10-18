import { Link } from "@tanstack/react-router";

interface CartSummaryProps {
  total: number;
}

export function CartSummary({ total }: CartSummaryProps) {
  const networkFee = 0.016;
  const grandTotal = total > 0 ? (total + networkFee).toFixed(3) : "0.00";

  return (
    <>
      {/* Mobile Summary Card (< lg) */}
      <div className="block lg:hidden rounded-[28px] bg-[#1c120e] border border-[#2e1d16] p-5 space-y-4 mt-6 shadow-2xl">
        {/* Promo Code */}
        <form className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="mobile-promo-code" className="sr-only">
            Código promocional
          </label>
          <input
            id="mobile-promo-code"
            type="text"
            placeholder="Digite o código promocional..."
            className="h-10 flex-1 rounded-full border border-[#3a2416] bg-[#2a1a13] px-4 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4893f]"
          />
          <button
            type="button"
            className="h-10 rounded-full bg-[#a66a3a] hover:bg-[#b87842] px-5 text-xs font-medium text-zinc-100 transition-colors shrink-0"
          >
            Aplicar
          </button>
        </form>

        {/* Breakdown */}
        <dl className="space-y-2.5 text-xs text-zinc-300 pt-1">
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
            <p className="mt-0.5 text-right text-[9px] text-[#c88243]">Taxa estimada</p>
          </div>
        </dl>

        {/* Total */}
        <div className="flex items-baseline justify-between pt-2 border-t border-[#2e1d16]">
          <span className="text-xs font-bold text-zinc-100">Total</span>
          <span className="text-base font-bold text-[#d4893f]">{grandTotal} ETH</span>
        </div>

        {/* Checkout CTA */}
        <Link
          to="/checkout"
          className="mt-2 block w-full rounded-full bg-[#c88243] hover:bg-[#d4893f] py-3.5 text-center text-xs font-bold text-[#1a110d] transition-colors shadow-lg cursor-pointer"
        >
          Conectar e finalizar
        </Link>
      </div>

      {/* Desktop Summary (>= lg) - Exact original preserved */}
      <aside aria-labelledby="summary-title" className="hidden lg:block text-xs">
        <h2 id="summary-title" className="text-xs font-bold text-zinc-100">
          Resumo da carteira
        </h2>
        <div className="mt-2 mb-4 border-b border-[#3a2416]" />

        {/* Promo Code */}
        <div>
          <h3 className="text-[11px] font-bold text-zinc-100">Código promocional</h3>
          <form className="mt-2 flex" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="promo-code" className="sr-only">
              Código promocional
            </label>
            <input
              id="promo-code"
              type="text"
              placeholder="Digite o código promocional..."
              className="min-w-0 flex-1 border border-[#4a3226] bg-[#1a110d] px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              className="bg-[#d4893f] px-3.5 text-xs font-medium text-[#1a110d] hover:bg-[#e09a52]"
            >
              Aplicar
            </button>
          </form>
        </div>

        {/* Breakdown */}
        <dl className="mt-5 space-y-2.5 text-xs text-zinc-300">
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
        <div className="mt-5 flex items-baseline justify-between pt-2">
          <span className="text-xs font-bold text-zinc-100">Total</span>
          <span className="text-sm font-bold text-[#d4893f]">{grandTotal} ETH</span>
        </div>

        {/* Checkout CTA */}
        <Link
          to="/checkout"
          className="mt-4 block w-full rounded-sm bg-[#d4893f] py-2 text-center text-xs font-bold text-[#1a110d] hover:bg-[#e09a52]"
        >
          Conectar e finalizar
        </Link>

        {/* Continue Exploring Link */}
        <Link
          to="/"
          className="mt-3 block text-center text-[11px] text-[#d4893f] hover:text-[#e09a52]"
        >
          Continuar explorando
        </Link>
      </aside>
    </>
  );
}
