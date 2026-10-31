import type { WalletInput } from "./wallet.service";

export interface WalletFormData extends Omit<
  WalletInput,
  "network" | "walletType"
> {
  network: WalletInput["network"] | "";
  walletType: WalletInput["walletType"] | "";
}

export type WalletFormField = keyof WalletFormData;
