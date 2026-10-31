import { walletService } from "@/features/account/components/wallet/wallet.service";
import type { User } from "@/features/auth/types/auth.types";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

export interface CheckoutFormData {
  displayName: string;
  username: string;
  network: string;
  profileName: string;
  walletAddress: string;
  secondaryWallet: string;
  walletType: string;
  referralCode: string;
  email: string;
  ensName: string;
  ensExtension: string;
  anotherWallet: string;
  collectorNote: string;
}

const initialFormData: CheckoutFormData = {
  displayName: "",
  username: "",
  network: "",
  profileName: "",
  walletAddress: "",
  secondaryWallet: "",
  walletType: "",
  referralCode: "",
  email: "",
  ensName: "",
  ensExtension: ".eth",
  anotherWallet: "",
  collectorNote: "",
};

function getEnsParts(ensName: string | null | undefined) {
  if (!ensName) {
    return {
      ensName: "",
      ensExtension: ".eth",
    };
  }

  const extensionIndex = ensName.lastIndexOf(".");

  if (extensionIndex === -1) {
    return {
      ensName,
      ensExtension: ".eth",
    };
  }

  return {
    ensName: ensName.substring(0, extensionIndex),
    ensExtension: ensName.substring(extensionIndex),
  };
}

function getWalletType(walletType: string | null | undefined) {
  const normalizedType = walletType?.trim().toLowerCase();

  const walletTypes: Record<string, string> = {
    metamask: "metamask",
    "coinbase wallet": "coinbase",
    coinbase: "coinbase",
    "wallet-connect": "wallet-connect",
    walletconnect: "wallet-connect",
    other: "other",
  };

  return normalizedType ? (walletTypes[normalizedType] ?? "") : "";
}

export function useCheckoutForm(user: User | null) {
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);

  const { data, isLoading: isLoadingWallets } = useQuery({
    queryKey: ["wallets"],
    queryFn: walletService.findAll,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const primaryWallet = data?.wallets.find(
      (wallet) => wallet.role === "primary",
    );

    const secondaryWallet = data?.wallets.find(
      (wallet) => wallet.role === "secondary",
    );

    const ens = getEnsParts(primaryWallet?.ensName || user.ensName);

    setFormData((current) => ({
      ...current,

      displayName: primaryWallet?.displayName || user.name || "",
      username: user.username || "",
      email: primaryWallet?.email || user.email || "",
      network: primaryWallet?.network || "",
      profileName: primaryWallet?.profileName || user.name || "",
      walletAddress: primaryWallet?.walletAddress || "",
      walletType: getWalletType(primaryWallet?.walletType || user.walletName),
      referralCode: primaryWallet?.referralCode || "",
      secondaryWallet:
        secondaryWallet?.walletAddress || primaryWallet?.secondaryEns || "",
      ensName: ens.ensName,
      ensExtension: ens.ensExtension,
    }));
  }, [user, data]);

  const handleChange = useCallback(
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = event.target;

      setFormData((current) => ({
        ...current,
        [name]: value,
      }));
    },
    [],
  );

  return {
    formData,
    handleChange,
    setFormData,
    isLoadingWallets,
  };
}
