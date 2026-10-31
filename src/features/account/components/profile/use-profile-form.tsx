import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import { useUpdateProfile } from "@/features/auth/hooks/use-update-profile";
import type { User } from "@/features/auth/types/auth.types";
import { isAxiosError } from "axios";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

interface ProfileFormData {
  name: string;
  username: string;
  email: string;
  ensName: string;
  walletName: string;
}

interface ApiError {
  message?: string;
}

export function useProfileForm(user: User) {
  const changePassword = useChangePassword();
  const updateProfile = useUpdateProfile();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name ?? "",
    username: user.username ?? "",
    email: user.email ?? "",
    ensName: user.ensName ?? "",
    walletName: user.walletName ?? "",
  });

  const [avatar, setAvatar] = useState<string | null>(user.avatar ?? null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    setFormData({
      name: user.name ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      ensName: user.ensName ?? "",
      walletName: user.walletName ?? "",
    });

    setAvatar(user.avatar ?? null);
  }, [
    user.name,
    user.username,
    user.email,
    user.ensName,
    user.walletName,
    user.avatar,
  ]);

  function handleChange(field: keyof ProfileFormData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatar(null);
  }

  function togglePassword(field: keyof typeof visiblePasswords) {
    setVisiblePasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasPasswordFields =
      currentPassword.length > 0 ||
      newPassword.length > 0 ||
      confirmPassword.length > 0;

    if (hasPasswordFields) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error("Preencha todos os campos de senha.");
        return;
      }

      if (newPassword.length < 8) {
        toast.error("A nova senha deve ter pelo menos 8 caracteres.");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("As senhas não coincidem.");
        return;
      }
    }

    try {
      await updateProfile.mutateAsync({
        ...formData,
        avatar,
      });

      if (hasPasswordFields) {
        await changePassword.mutateAsync({
          currentPassword,
          newPassword,
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setVisiblePasswords({
          current: false,
          new: false,
          confirm: false,
        });
      }

      toast.success(
        hasPasswordFields
          ? "Perfil e senha atualizados com sucesso!"
          : "Perfil atualizado com sucesso!",
      );
    } catch (error) {
      const message = isAxiosError<ApiError>(error)
        ? error.response?.data?.message
        : undefined;

      toast.error(message ?? "Não foi possível atualizar seu perfil.");
    }
  }

  return {
    formData,
    avatar,
    currentPassword,
    newPassword,
    confirmPassword,
    visiblePasswords,

    isChangingPassword: changePassword.isPending,
    isUpdatingProfile: updateProfile.isPending,
    isSaving: changePassword.isPending || updateProfile.isPending,

    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,

    handleChange,
    handleAvatarChange,
    handleRemoveAvatar,
    togglePassword,
    handleSubmit,
  };
}
