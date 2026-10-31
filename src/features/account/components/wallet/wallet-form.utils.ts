import type { WalletInput } from "./wallet.service";
import type { WalletFormData } from "./wallet-form.types";

export function isValidWalletData(
  wallet: WalletFormData,
): wallet is WalletInput {
  return Boolean(wallet.network && wallet.walletType);
}