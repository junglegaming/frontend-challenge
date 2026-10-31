import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { initialWalletData, walletsQueryKey } from "./wallet-form.constants";
import type { WalletFormData, WalletFormField } from "./wallet-form.types";
import { isValidWalletData } from "./wallet-form.utils";
import { walletService, type CreateWalletDTO } from "./wallet.service";

export function useWalletForm() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: isLoadingWallets,
    isError,
  } = useQuery({
    queryKey: walletsQueryKey,
    queryFn: walletService.findAll,
  });

  const wallets = data?.wallets ?? [];
  const wallet = wallets[0] ?? null;
  const hasWallet = Boolean(wallet);

  const [walletData, setWalletData] = useState<WalletFormData>({
    ...initialWalletData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null);

  function handleChange(field: WalletFormField, value: string) {
    setWalletData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasWallet) {
      toast.error("Você já possui uma carteira cadastrada.");
      return;
    }

    if (!isValidWalletData(walletData)) {
      toast.error("Selecione a rede e o tipo da carteira.");
      return;
    }

    const payload: CreateWalletDTO = {
      primaryWallet: walletData,
    };

    try {
      setIsSubmitting(true);

      const response = await walletService.create(payload);

      queryClient.setQueryData(walletsQueryKey, {
        wallets: response.wallets,
      });

      toast.success("Carteira cadastrada com sucesso!");

      setWalletData({ ...initialWalletData });
    } catch (error) {
      console.error("Erro ao cadastrar carteira:", error);

      if (axios.isAxiosError(error)) {
        console.error("Status:", error.response?.status);
        console.error("Resposta do backend:", error.response?.data);

        toast.error(
          error.response?.data?.message ??
            `Erro ao cadastrar carteira (${error.response?.status ?? "sem resposta do servidor"}).`,
        );
      } else {
        toast.error("Não foi possível cadastrar a carteira.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteWallet(id: string) {
    try {
      setDeletingWalletId(id);

      await walletService.remove(id);

      queryClient.setQueryData(
        walletsQueryKey,
        (
          current:
            Awaited<ReturnType<typeof walletService.findAll>> | undefined,
        ) =>
          current
            ? {
                ...current,
                wallets: current.wallets.filter((wallet) => wallet.id !== id),
              }
            : current,
      );

      toast.success("Carteira excluída com sucesso!");
    } catch {
      toast.error("Não foi possível excluir a carteira.");
    } finally {
      setDeletingWalletId(null);
    }
  }

  return {
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
  };
}
