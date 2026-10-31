import type { WalletFormData } from "./wallet-form.types";
import type { WalletInput } from "./wallet.service";

export const initialWalletData: WalletFormData = {
  displayName: "",
  walletNickname: "",
  network: "",
  profileName: "",
  walletAddress: "",
  secondaryEns: "",
  walletType: "",
  referralCode: "",
  email: "",
  ensName: "",
  ensExtension: ".eth",
};

export const walletNetworks = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "solana", label: "Solana" },
] satisfies { value: WalletInput["network"]; label: string }[];

export const walletTypes = [
  { value: "metamask", label: "MetaMask" },
  { value: "wallet-connect", label: "WalletConnect" },
  { value: "coinbase", label: "Coinbase Wallet" },
  { value: "other", label: "Outra" },
] satisfies { value: WalletInput["walletType"]; label: string }[];

export const ensExtensions = [".eth"];

export const walletsQueryKey = ["wallets"] as const;
