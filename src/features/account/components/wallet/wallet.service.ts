import { api } from "@/lib/axios";

export interface WalletInput {
  displayName: string;
  walletNickname: string;
  network: "ethereum" | "polygon" | "solana";
  profileName: string;
  walletAddress: string;
  secondaryEns: string;
  walletType: "metamask" | "wallet-connect" | "coinbase" | "other";
  referralCode: string;
  email: string;
  ensName: string;
  ensExtension: string;
}

export interface CreateWalletDTO {
  primaryWallet: WalletInput;
  secondaryWallet?: WalletInput | null;
}

export interface Wallet extends WalletInput {
  id: string;
  userId: string;
  role: "primary" | "secondary";
  createdAt: string;
}

interface WalletResponse {
  wallets: Wallet[];
}

interface CreateWalletResponse {
  message: string;
  wallets: Wallet[];
}

export const walletService = {
  findAll: async () => {
    const response = await api.get<WalletResponse>("/wallets");
    return response.data;
  },

  create: async (data: CreateWalletDTO) => {
    const response = await api.post<CreateWalletResponse>("/wallets", data);
    return response.data;
  },

  remove: async (id: string) => {
    await api.delete(`/wallets/${id}`);
  },
};
