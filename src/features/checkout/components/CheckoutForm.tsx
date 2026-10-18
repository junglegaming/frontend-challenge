import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CheckoutFormProps {
  formId: string;
  onSubmit: (e: React.FormEvent) => void;
}

export function CheckoutForm({ formId, onSubmit }: CheckoutFormProps) {
  const [useAnotherWallet, setUseAnotherWallet] = useState(false);

  return (
    <section aria-labelledby="profile-title" className="text-xs">
      <h2 id="profile-title" className="text-xs font-bold text-zinc-100 mb-3">
        Perfil do colecionador
      </h2>

      <form id={formId} onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {/* Nome de exibição */}
          <div>
            <label htmlFor="display-name" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Nome de exibição<span className="text-[#d4893f]">*</span>
            </label>
            <input
              id="display-name"
              type="text"
              required
              className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
            />
          </div>

          {/* Nome de usuário */}
          <div>
            <label htmlFor="username" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Nome de usuário<span className="text-[#d4893f]">*</span>
            </label>
            <input
              id="username"
              type="text"
              required
              className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
            />
          </div>

          {/* Rede */}
          <div>
            <label htmlFor="network-select" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Rede <span className="text-[#d4893f]">*</span>
            </label>
            <div className="relative">
              <select
                id="network-select"
                required
                defaultValue=""
                className="w-full appearance-none bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-400 h-9 px-3 pr-8 rounded-none focus:outline-none focus:border-[#d4893f] cursor-pointer"
              >
                <option value="" disabled>
                  Selecione uma rede
                </option>
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="solana">Solana</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" aria-hidden="true" />
            </div>
          </div>

          {/* Nome do perfil */}
          <div>
            <label htmlFor="profile-name" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Nome do perfil<span className="text-[#d4893f]">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              required
              className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
            />
          </div>

          {/* Endereço da carteira */}
          <div>
            <label htmlFor="wallet-address" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Endereço da carteira<span className="text-[#d4893f]">*</span>
            </label>
            <input
              id="wallet-address"
              type="text"
              required
              placeholder="Endereço 0x da carteira"
              className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
            />
          </div>

          {/* ENS ou carteira secundária (opcional) */}
          <div className="flex flex-col justify-end">
            <label htmlFor="secondary-wallet" className="sr-only">
              ENS ou carteira secundária (opcional)
            </label>
            <input
              id="secondary-wallet"
              type="text"
              placeholder="ENS ou carteira secundária (opcional)"
              className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
            />
          </div>

          {/* Tipo de carteira */}
          <div>
            <label htmlFor="wallet-type" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Tipo de carteira<span className="text-[#d4893f]">*</span>
            </label>
            <div className="relative">
              <select
                id="wallet-type"
                required
                defaultValue=""
                className="w-full appearance-none bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-400 h-9 px-3 pr-8 rounded-none focus:outline-none focus:border-[#d4893f] cursor-pointer"
              >
                <option value="" disabled>
                  Selecione uma carteira
                </option>
                <option value="metamask">MetaMask</option>
                <option value="coinbase">Coinbase Wallet</option>
                <option value="walletconnect">WalletConnect</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" aria-hidden="true" />
            </div>
          </div>

          {/* Código de indicação */}
          <div>
            <label htmlFor="referral-code" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Código de indicação<span className="text-[#d4893f]">*</span>
            </label>
            <input
              id="referral-code"
              type="text"
              required
              className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
            />
          </div>

          {/* E-mail */}
          <div>
            <label htmlFor="email" className="block text-[11px] text-zinc-200 font-medium mb-1">
              E-mail<span className="text-[#d4893f]">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
            />
          </div>

          {/* Nome ENS */}
          <div>
            <label htmlFor="ens-select" className="block text-[11px] text-zinc-200 font-medium mb-1">
              Nome ENS <span className="text-[#d4893f]">*</span>
            </label>
            <div className="relative w-24">
              <select
                id="ens-select"
                defaultValue=".eth"
                className="w-full appearance-none bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-200 h-9 px-3 pr-7 rounded-none focus:outline-none focus:border-[#d4893f] cursor-pointer"
              >
                <option value=".eth">.eth</option>
                <option value=".crypto">.crypto</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Usar outra carteira? */}
        <div className="pt-1">
          <button
            type="button"
            role="checkbox"
            aria-checked={useAnotherWallet}
            onClick={() => setUseAnotherWallet((prev) => !prev)}
            className="flex items-center gap-2 text-xs text-zinc-300 hover:text-zinc-100 select-none text-left"
          >
            <span
              className={`size-3 rounded-full border ${
                useAnotherWallet ? "border-[#d4893f]" : "border-zinc-500"
              } flex items-center justify-center`}
              aria-hidden="true"
            >
              {useAnotherWallet && <span className="size-1.5 rounded-full bg-[#d4893f]" />}
            </span>
            <span>Usar outra carteira?</span>
          </button>
        </div>

        {/* Observação do colecionador */}
        <div className="pt-1">
          <label htmlFor="collector-notes" className="block text-[11px] text-zinc-200 font-medium mb-1">
            Observação do colecionador (opcional)
          </label>
          <textarea
            id="collector-notes"
            rows={4}
            className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 p-3 rounded-none focus:outline-none focus:border-[#d4893f] resize-none"
          />
        </div>
      </form>
    </section>
  );
}
