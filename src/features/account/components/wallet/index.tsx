import { useWalletForm } from "./use-wallet-form";
import { WalletFields } from "./wallet-fields";

const networkLabels = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  solana: "Solana",
};

const walletTypeLabels = {
  metamask: "MetaMask",
  "wallet-connect": "WalletConnect",
  coinbase: "Coinbase Wallet",
  other: "Outra",
};

export function WalletForm() {
  const {
    wallet,
    hasWallet,
    isLoadingWallets,
    isError,
    walletData,
    isSubmitting,
    deletingWalletId,
    handleChange,
    handleSubmit,
    handleDeleteWallet,
  } = useWalletForm();

  if (isLoadingWallets) {
    return <p className="text-sm text-[#bca68b]">Carregando carteira...</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-[#f0784b]">
        Não foi possível carregar sua carteira.
      </p>
    );
  }

  if (hasWallet && wallet) {
    return (
      <div className="space-y-6">
        <section>
          <div className="mb-6">
            <h1 className="text-base font-bold text-[#f5eee9]">
              Carteira cadastrada
            </h1>

            <p className="mt-1 text-sm text-[#bca68b]">
              Sua carteira fica disponível no pagamento e para receber NFTs
              comprados.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#f5eee9]">
                Minha carteira
              </h2>

              <span className="rounded-full bg-[#245c43]/20 px-3 py-1 text-xs font-medium text-[#83c9a4]">
                Cadastrada
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-2">
              <div>
                <p className="text-[#bca68b]">Nome de exibição</p>
                <p className="mt-1 text-[#f5eee9]">{wallet.displayName}</p>
              </div>

              <div>
                <p className="text-[#bca68b]">Apelido da carteira</p>
                <p className="mt-1 text-[#f5eee9]">{wallet.walletNickname}</p>
              </div>

              <div>
                <p className="text-[#bca68b]">Rede</p>
                <p className="mt-1 text-[#f5eee9]">
                  {networkLabels[wallet.network]}
                </p>
              </div>

              <div>
                <p className="text-[#bca68b]">Nome do perfil</p>
                <p className="mt-1 text-[#f5eee9]">{wallet.profileName}</p>
              </div>

              <div>
                <p className="text-[#bca68b]">Endereço da carteira</p>
                <p className="mt-1 break-all text-[#f5eee9]">
                  {wallet.walletAddress}
                </p>
              </div>

              <div>
                <p className="text-[#bca68b]">Tipo de carteira</p>
                <p className="mt-1 text-[#f5eee9]">
                  {walletTypeLabels[wallet.walletType]}
                </p>
              </div>

              <div>
                <p className="text-[#bca68b]">E-mail</p>
                <p className="mt-1 text-[#f5eee9]">{wallet.email}</p>
              </div>

              <div>
                <p className="text-[#bca68b]">ENS</p>
                <p className="mt-1 text-[#f5eee9]">
                  {wallet.ensName}
                  {wallet.ensExtension}
                </p>
              </div>

              {wallet.secondaryEns && (
                <div>
                  <p className="text-[#bca68b]">ENS ou carteira secundária</p>
                  <p className="mt-1 break-all text-[#f5eee9]">
                    {wallet.secondaryEns}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[#40271d] pt-4">
              <button
                type="button"
                onClick={() => handleDeleteWallet(wallet.id)}
                disabled={deletingWalletId !== null}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#f0784b] transition-colors hover:bg-[#f0784b]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingWalletId === wallet.id
                  ? "Excluindo..."
                  : "Excluir carteira"}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <div className="mb-8">
          <h1 className="text-base font-bold text-[#f5eee9]">Minha carteira</h1>

          <p className="mt-1 text-sm text-[#bca68b]">
            Escolha a rede e o tipo da sua carteira para cadastrá-la.
          </p>
        </div>

        <WalletFields values={walletData} onChange={handleChange} />
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#d9904b] px-5 py-3 text-sm font-bold text-[#160d09] transition hover:bg-[#e9a15c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Salvando..." : "Salvar carteira"}
        </button>
      </div>
    </form>
  );
}
