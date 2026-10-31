import type {
  CreateWalletDTO,
  Wallet,
  WalletInput,
} from "@/features/account/components/wallet/wallet.service";
import { http, HttpResponse } from "msw";
import { getAuthenticatedUser } from "../auth/auth.utils";

function getWallets(userId: string): Wallet[] {
  try {
    const storedWallets = localStorage.getItem(`kurio-wallets-${userId}`);

    if (!storedWallets) return [];

    const parsed: unknown = JSON.parse(storedWallets);

    return Array.isArray(parsed) ? (parsed as Wallet[]) : [];
  } catch {
    return [];
  }
}

function saveWallets(userId: string, wallets: Wallet[]) {
  localStorage.setItem(`kurio-wallets-${userId}`, JSON.stringify(wallets));
}

function isValidWallet(wallet: WalletInput) {
  return Boolean(
    wallet.displayName?.trim() &&
    wallet.walletNickname?.trim() &&
    wallet.network &&
    wallet.profileName?.trim() &&
    wallet.walletAddress?.trim() &&
    wallet.walletType &&
    wallet.referralCode?.trim() &&
    wallet.email?.trim() &&
    wallet.ensName?.trim() &&
    wallet.ensExtension?.trim(),
  );
}

export const walletsHandlers = [
  // Buscar carteira
  http.get("/api/wallets", ({ request }) => {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return HttpResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      wallets: getWallets(user.id),
    });
  }),

  // Cadastrar carteira
  http.post("/api/wallets", async ({ request }) => {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return HttpResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 },
      );
    }

    const existingWallets = getWallets(user.id);

    if (existingWallets.length > 0) {
      return HttpResponse.json(
        { message: "Você já possui uma carteira cadastrada." },
        { status: 409 },
      );
    }

    const body = (await request.json()) as CreateWalletDTO;

    if (!body.primaryWallet || !isValidWallet(body.primaryWallet)) {
      return HttpResponse.json(
        {
          message: "Preencha todos os campos obrigatórios da carteira.",
        },
        { status: 400 },
      );
    }

    const wallet: Wallet = {
      ...body.primaryWallet,
      id: crypto.randomUUID(),
      userId: user.id,
      role: "primary",
      createdAt: new Date().toISOString(),
    };

    const wallets = [wallet];

    saveWallets(user.id, wallets);

    return HttpResponse.json(
      {
        message: "Carteira cadastrada com sucesso.",
        wallets,
      },
      { status: 201 },
    );
  }),

  // Excluir carteira
  http.delete("/api/wallets/:id", ({ request, params }) => {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return HttpResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 },
      );
    }

    const walletId = params.id;
    const wallets = getWallets(user.id);

    const walletExists = wallets.some((wallet) => wallet.id === walletId);

    if (!walletExists) {
      return HttpResponse.json(
        { message: "Carteira não encontrada." },
        { status: 404 },
      );
    }

    const updatedWallets = wallets.filter((wallet) => wallet.id !== walletId);

    saveWallets(user.id, updatedWallets);

    return HttpResponse.json({
      message: "Carteira excluída com sucesso.",
    });
  }),
];
