import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Check } from "lucide-react";
import { Header } from "@/features/home/components/Header";
import { useAuth } from "@/features/auth/auth-context";
import { ProfileSidebar } from "@/features/profile/components/ProfileSidebar";
import { Button } from "@/components/ui/button";

export function WalletsPage() {
  const { user } = useAuth();

  // Primary wallet state
  const [displayName, setDisplayName] = useState(user?.name ?? "Colecionador Kurio");
  const [walletNickname, setWalletNickname] = useState("Carteira Principal");
  const [network, setNetwork] = useState("");
  const [profileName, setProfileName] = useState(user?.name ? `@${user.name.toLowerCase().replace(/\s+/g, "")}` : "@kurio");
  const [walletAddress, setWalletAddress] = useState("");
  const [secondaryWalletOrEns, setSecondaryWalletOrEns] = useState("");
  const [walletType, setWalletType] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [email, setEmail] = useState(user?.email ?? "usuario@kurio.art");
  const [ensSuffix, setEnsSuffix] = useState(".eth");

  // Secondary wallet state
  const [sameAsPrimary, setSameAsPrimary] = useState(false);
  const [isAddingSecondary, setIsAddingSecondary] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#140d0a] font-mono text-zinc-100 flex flex-col">
      <Header />

      <main className="mx-auto max-w-[1200px] w-full px-4 pt-6 pb-16 xl:px-0 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-400 mb-6">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-[#d4893f] transition-colors">
                Início
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-600">/</li>
            <li className="text-zinc-400">Meu perfil</li>
            <li aria-hidden="true" className="text-zinc-600">/</li>
            <li aria-current="page" className="text-zinc-200 font-medium">Carteiras</li>
          </ol>
        </nav>

        {/* 2-column layout: Sidebar + Content */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <ProfileSidebar activeItem="wallets" />

          {/* Main Content Area */}
          <div className="flex-1 w-full space-y-6">
            {/* Primary Wallet Card */}
            <section
              aria-labelledby="wallets-title"
              className="w-full bg-[#241612] border border-[#3a2416] p-6 text-xs"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-4 mb-1">
                <h1 id="wallets-title" className="text-sm font-bold text-zinc-100">
                  Carteira principal
                </h1>

                <button
                  type="button"
                  onClick={() => setIsAddingSecondary(true)}
                  className="text-xs text-[#d4893f] font-medium hover:underline transition-colors"
                >
                  Adicionar
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 mb-6">
                Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
              </p>

              {savedSuccess && (
                <div
                  role="status"
                  className="mb-6 flex items-center gap-2 border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300"
                >
                  <Check className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>Carteira principal salva com sucesso!</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Nome de exibição */}
                  <div>
                    <label htmlFor="wallet-display-name" className="block text-[11px] text-zinc-200 font-medium mb-1">
                      Nome de exibição<span className="text-[#d4893f]">*</span>
                    </label>
                    <input
                      id="wallet-display-name"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                    />
                  </div>

                  {/* Apelido da carteira */}
                  <div>
                    <label htmlFor="wallet-nickname" className="block text-[11px] text-zinc-200 font-medium mb-1">
                      Apelido da carteira<span className="text-[#d4893f]">*</span>
                    </label>
                    <input
                      id="wallet-nickname"
                      type="text"
                      required
                      value={walletNickname}
                      onChange={(e) => setWalletNickname(e.target.value)}
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
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        className="w-full appearance-none bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-300 h-9 px-3 pr-8 rounded-none focus:outline-none focus:border-[#d4893f] cursor-pointer"
                      >
                        <option value="" disabled>
                          Selecione uma rede
                        </option>
                        <option value="ethereum">Ethereum</option>
                        <option value="polygon">Polygon</option>
                        <option value="solana">Solana</option>
                      </select>
                      <ChevronDown
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none"
                        aria-hidden="true"
                      />
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
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
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
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
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
                      value={secondaryWalletOrEns}
                      onChange={(e) => setSecondaryWalletOrEns(e.target.value)}
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
                        value={walletType}
                        onChange={(e) => setWalletType(e.target.value)}
                        className="w-full appearance-none bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-300 h-9 px-3 pr-8 rounded-none focus:outline-none focus:border-[#d4893f] cursor-pointer"
                      >
                        <option value="" disabled>
                          Selecione uma carteira
                        </option>
                        <option value="metamask">MetaMask</option>
                        <option value="coinbase">Coinbase Wallet</option>
                        <option value="walletconnect">WalletConnect</option>
                      </select>
                      <ChevronDown
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none"
                        aria-hidden="true"
                      />
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
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                    />
                  </div>

                  {/* Nome ENS */}
                  <div>
                    <label htmlFor="ens-suffix" className="block text-[11px] text-zinc-200 font-medium mb-1">
                      Nome ENS <span className="text-[#d4893f]">*</span>
                    </label>
                    <div className="relative w-28">
                      <select
                        id="ens-suffix"
                        value={ensSuffix}
                        onChange={(e) => setEnsSuffix(e.target.value)}
                        className="w-full appearance-none bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-200 h-9 px-3 pr-7 rounded-none focus:outline-none focus:border-[#d4893f] cursor-pointer"
                      >
                        <option value=".eth">.eth</option>
                        <option value=".crypto">.crypto</option>
                        <option value=".sol">.sol</option>
                      </select>
                      <ChevronDown
                        className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant={null}
                    size={null}
                    className="h-auto border-0 bg-[#d4893f] text-[#1a110d] font-bold text-xs px-5 py-2 rounded-none hover:bg-[#e09a52] transition-colors active:not-aria-[haspopup]:translate-y-0"
                  >
                    Salvar carteira
                  </Button>
                </div>
              </form>
            </section>

            {/* Secondary Wallet Section */}
            <section
              aria-labelledby="secondary-wallet-title"
              className="w-full bg-[#241612] border border-[#3a2416] p-5 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Info */}
                <div>
                  <h2 id="secondary-wallet-title" className="text-xs font-bold text-zinc-200">
                    Carteira secundária
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {sameAsPrimary
                      ? "Espelhando endereço e dados da carteira principal."
                      : "Você ainda não adicionou uma carteira secundária."}
                  </p>
                </div>

                {/* Right: Same as primary + Add */}
                <div className="flex items-center gap-5 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300 hover:text-zinc-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={sameAsPrimary}
                      onChange={(e) => setSameAsPrimary(e.target.checked)}
                      className="size-3.5 accent-[#d4893f] rounded-none cursor-pointer"
                    />
                    <span>Igual à carteira principal</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsAddingSecondary(!isAddingSecondary)}
                    className="text-xs text-[#d4893f] font-medium hover:underline transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Collapsible secondary form if user chooses to add */}
              {isAddingSecondary && !sameAsPrimary && (
                <div className="mt-4 pt-4 border-t border-[#3a2416] text-[11px] text-zinc-400 space-y-3">
                  <p className="text-zinc-300">Configuração de carteira secundária:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Endereço 0x da carteira secundária"
                      className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                    />
                    <input
                      type="text"
                      placeholder="Apelido da carteira secundária"
                      className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
