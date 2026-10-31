import {
  ensExtensions,
  walletNetworks,
  walletTypes,
} from "./wallet-form.constants";

import type { WalletFormData } from "./wallet-form.types";

interface WalletFieldsProps {
  values: WalletFormData;
  onChange: (field: keyof WalletFormData, value: string) => void;
}

export function WalletFields({ values, onChange }: WalletFieldsProps) {
  const inputClassName =
    "h-10 w-full rounded-sm border border-[#40271d] bg-[#160d09] px-3 text-sm text-[#f5eee9] outline-none transition placeholder:text-[#a98a57] focus:border-[#d9904b]";

  const selectClassName =
    "h-10 w-full rounded-sm border border-[#40271d] bg-[#160d09] px-3 text-sm text-[#f5eee9] outline-none transition focus:border-[#d9904b]";

  const optionClassName = "bg-[#160d09] text-[#f5eee9]";

  const labelClassName = "mb-1 block text-sm text-[#e9dfd8]";

  const required = <span className="text-[#f0784b]">*</span>;

  return (
    <div className="grid grid-cols-1 gap-x-7 gap-y-7 md:grid-cols-2">
      <div>
        <label className={labelClassName}>Nome de exibição {required}</label>
        <input
          className={inputClassName}
          value={values.displayName}
          onChange={(event) => onChange("displayName", event.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClassName}>Apelido da carteira {required}</label>
        <input
          className={inputClassName}
          value={values.walletNickname}
          onChange={(event) => onChange("walletNickname", event.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClassName}>Rede {required}</label>
        <select
          className={selectClassName}
          value={values.network}
          onChange={(event) => onChange("network", event.target.value)}
          required
        >
          <option value="" disabled className={optionClassName}>
            Selecione uma rede
          </option>

          {walletNetworks.map((network) => (
            <option
              key={network.value}
              value={network.value}
              className={optionClassName}
            >
              {network.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClassName}>Nome do perfil {required}</label>
        <input
          className={inputClassName}
          value={values.profileName}
          onChange={(event) => onChange("profileName", event.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClassName}>
          Endereço da carteira {required}
        </label>
        <input
          className={inputClassName}
          placeholder="Endereço 0x da carteira"
          value={values.walletAddress}
          onChange={(event) => onChange("walletAddress", event.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClassName}>
          ENS ou carteira secundária (opcional)
        </label>
        <input
          className={inputClassName}
          placeholder="ENS ou endereço secundário"
          value={values.secondaryEns}
          onChange={(event) => onChange("secondaryEns", event.target.value)}
        />
      </div>

      <div>
        <label className={labelClassName}>Tipo de carteira {required}</label>
        <select
          className={selectClassName}
          value={values.walletType}
          onChange={(event) => onChange("walletType", event.target.value)}
          required
        >
          <option value="" disabled className={optionClassName}>
            Selecione uma carteira
          </option>

          {walletTypes.map((type) => (
            <option
              key={type.value}
              value={type.value}
              className={optionClassName}
            >
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClassName}>Código de indicação {required}</label>
        <input
          className={inputClassName}
          value={values.referralCode}
          onChange={(event) => onChange("referralCode", event.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClassName}>E-mail {required}</label>
        <input
          type="email"
          className={inputClassName}
          value={values.email}
          onChange={(event) => onChange("email", event.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClassName}>Nome ENS {required}</label>

        <div className="flex gap-2">
          <select
            className="h-10 rounded-sm border border-[#40271d] bg-[#160d09] px-2 text-sm text-[#f5eee9] outline-none focus:border-[#d9904b]"
            value={values.ensExtension}
            onChange={(event) => onChange("ensExtension", event.target.value)}
          >
            {ensExtensions.map((extension) => (
              <option
                key={extension}
                value={extension}
                className={optionClassName}
              >
                {extension}
              </option>
            ))}
          </select>

          <input
            className={inputClassName}
            value={values.ensName}
            onChange={(event) => onChange("ensName", event.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
