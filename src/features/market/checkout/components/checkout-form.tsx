import type { User } from "@/features/auth/types/auth.types";
import { useCheckoutForm } from "../hooks/use-checkout-form";

interface CheckoutFormProps {
  user: User | null;
  useAnotherWallet: boolean;
  onUseAnotherWalletChange: (value: boolean) => void;
}

const inputClassName =
  "h-10 w-full cursor-not-allowed rounded-control border border-border bg-transparent px-3 text-sm text-foreground opacity-100 outline-none";

const labelClassName = "mb-1.5 block text-sm text-foreground";

const optionClassName = "bg-[#241611] text-[#f5eee9]";

export function CheckoutForm({ user, useAnotherWallet }: CheckoutFormProps) {
  const { formData } = useCheckoutForm(user);

  return (
    <section className="min-w-0">
      <h2 className="mb-3 text-base font-bold text-foreground">
        Perfil do colecionador
      </h2>

      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <label htmlFor="display-name" className={labelClassName}>
            Nome de exibição<span className="text-primary">*</span>
          </label>
          <input
            id="display-name"
            name="displayName"
            value={formData.displayName}
            readOnly
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="username" className={labelClassName}>
            Nome de usuário<span className="text-primary">*</span>
          </label>
          <input
            id="username"
            name="username"
            value={formData.username}
            readOnly
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="network" className={labelClassName}>
            Rede <span className="text-primary">*</span>
          </label>
          <select
            id="network"
            name="network"
            value={formData.network}
            disabled
            className={`${inputClassName} [color-scheme:dark]`}
          >
            <option value="" disabled className={optionClassName}>
              Selecione uma rede
            </option>
            <option value="ethereum" className={optionClassName}>
              Ethereum
            </option>
            <option value="polygon" className={optionClassName}>
              Polygon
            </option>
            <option value="base" className={optionClassName}>
              Base
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="profile-name" className={labelClassName}>
            Nome do perfil<span className="text-primary">*</span>
          </label>
          <input
            id="profile-name"
            name="profileName"
            value={formData.profileName}
            readOnly
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="wallet-address" className={labelClassName}>
            Endereço da carteira<span className="text-primary">*</span>
          </label>
          <input
            id="wallet-address"
            name="walletAddress"
            value={formData.walletAddress}
            readOnly
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col">
          <span aria-hidden="true" className="mb-1.5 block h-[21px]" />
          <input
            id="ens-secondary"
            name="secondaryWallet"
            aria-label="ENS ou carteira secundária"
            value={formData.secondaryWallet}
            readOnly
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="wallet-type" className={labelClassName}>
            Tipo de carteira<span className="text-primary">*</span>
          </label>
          <select
            id="wallet-type"
            name="walletType"
            value={formData.walletType}
            disabled
            className={`${inputClassName} [color-scheme:dark]`}
          >
            <option value="" disabled className={optionClassName}>
              Selecione uma carteira
            </option>
            <option value="metamask" className={optionClassName}>
              MetaMask
            </option>
            <option value="coinbase" className={optionClassName}>
              Coinbase Wallet
            </option>
            <option value="walletconnect" className={optionClassName}>
              WalletConnect
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="referral-code" className={labelClassName}>
            Código de indicação<span className="text-primary">*</span>
          </label>
          <input
            id="referral-code"
            name="referralCode"
            value={formData.referralCode}
            readOnly
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClassName}>
            E-mail<span className="text-primary">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            readOnly
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="ens-name" className={labelClassName}>
            Nome ENS<span className="text-primary">*</span>
          </label>

          <div className="flex gap-2">
            <input
              id="ens-name"
              name="ensName"
              value={formData.ensName}
              readOnly
              className="h-10 w-24 cursor-not-allowed rounded-control border border-border bg-transparent px-3 text-sm text-foreground opacity-100 outline-none"
            />

            <select
              name="ensExtension"
              aria-label="Extensão ENS"
              value={formData.ensExtension}
              disabled
              className="h-10 cursor-not-allowed rounded-control border border-border bg-transparent px-3 text-sm text-foreground opacity-100 outline-none [color-scheme:dark]"
            >
              <option value=".eth" className={optionClassName}>
                .eth
              </option>
            </select>
          </div>
        </div>
      </div>

      {useAnotherWallet && (
        <div className="mt-4">
          <label htmlFor="another-wallet" className={labelClassName}>
            Endereço da outra carteira
          </label>
          <input
            id="another-wallet"
            name="anotherWallet"
            value={formData.anotherWallet}
            readOnly
            className={inputClassName}
          />
        </div>
      )}
    </section>
  );
}
