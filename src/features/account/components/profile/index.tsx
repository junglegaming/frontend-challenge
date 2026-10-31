import type { User } from "@/features/auth/types/auth.types";
import { Eye, EyeOff, ImagePlus } from "lucide-react";
import { useProfileForm } from "./use-profile-form";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const {
    formData,
    avatar,
    currentPassword,
    newPassword,
    confirmPassword,
    visiblePasswords,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleChange,
    handleAvatarChange,
    handleRemoveAvatar,
    togglePassword,
    handleSubmit,
  } = useProfileForm(user);

  const inputClassName =
    "h-10 w-full rounded-[3px] border border-[#4b2d20] bg-transparent px-3 text-sm text-[#f5eee9] outline-none transition-colors placeholder:text-[#80695c] focus:border-[#d9904b]";

  const labelClassName = "mb-2 block text-sm text-[#f0e8e2]";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h1 className="mb-8 text-base font-bold text-[#f5eee9]">
        Perfil do colecionador
      </h1>

      <div className="grid grid-cols-1 gap-x-7 gap-y-6 lg:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className={labelClassName}>
            Nome de exibição<span className="text-[#e97848]">*</span>
          </label>

          <input
            id="profile-name"
            required
            value={formData.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="profile-username" className={labelClassName}>
            Nome de usuário<span className="text-[#e97848]">*</span>
          </label>

          <input
            id="profile-username"
            required
            value={formData.username}
            onChange={(event) => handleChange("username", event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="profile-email" className={labelClassName}>
            E-mail<span className="text-[#e97848]">*</span>
          </label>

          <input
            id="profile-email"
            type="email"
            required
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="profile-ens" className={labelClassName}>
            Nome ENS <span className="text-[#e97848]">*</span>
          </label>

          <div className="flex gap-2">
            <select
              aria-label="Extensão ENS"
              className="h-10 rounded-[3px] border border-[#4b2d20] bg-[#160e0b] px-3 text-sm text-[#f5eee9] outline-none focus:border-[#d9904b]"
            >
              <option value=".eth">.eth</option>
            </select>

            <input
              id="profile-ens"
              value={formData.ensName}
              onChange={(event) => handleChange("ensName", event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-wallet" className={labelClassName}>
            Apelido da carteira<span className="text-[#e97848]">*</span>
          </label>

          <input
            id="profile-wallet"
            required
            value={formData.walletName}
            onChange={(event) => handleChange("walletName", event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <span className={labelClassName}>Avatar</span>

          <div className="flex items-center gap-6">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-[#4b2d20] bg-[#382219] text-[#d9904b]">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar do usuário"
                  className="size-full object-cover"
                />
              ) : (
                <ImagePlus className="size-6" />
              )}
            </div>

            <label className="cursor-pointer rounded-[3px] bg-[#d9904b] px-5 py-3 text-sm font-bold text-[#160e0b] transition-colors hover:bg-[#e9a565]">
              Alterar
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-sm text-[#e5dcd5] transition-colors hover:text-[#d9904b]"
            >
              Remover
            </button>
          </div>
        </div>
      </div>

      <section className="mt-7 max-w-[417px]">
        <h2 className="mb-5 text-base font-semibold text-[#f5eee9]">
          Alterar senha
        </h2>

        <div className="space-y-5">
          <PasswordField
            label="Senha atual"
            value={currentPassword}
            visible={visiblePasswords.current}
            onChange={setCurrentPassword}
            onToggle={() => togglePassword("current")}
            inputClassName={inputClassName}
          />

          <PasswordField
            label="Nova senha"
            value={newPassword}
            visible={visiblePasswords.new}
            onChange={setNewPassword}
            onToggle={() => togglePassword("new")}
            inputClassName={inputClassName}
          />

          <PasswordField
            label="Confirmar nova senha"
            value={confirmPassword}
            visible={visiblePasswords.confirm}
            onChange={setConfirmPassword}
            onToggle={() => togglePassword("confirm")}
            inputClassName={inputClassName}
          />
        </div>
      </section>

      <button
        type="submit"
        className="mt-8 min-w-[131px] rounded-[3px] bg-[#d9904b] px-6 py-3 text-sm font-bold text-[#160e0b] transition-colors hover:bg-[#e9a565]"
      >
        Salvar
      </button>
    </form>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  inputClassName: string;
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggle,
  inputClassName,
}: PasswordFieldProps) {
  const id = label.toLowerCase().replaceAll(" ", "-");

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-[#f0e8e2]">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClassName} pr-11`}
          autoComplete="off"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-3 flex items-center text-[#bd945b] hover:text-[#e9a565]"
        >
          {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </div>
    </div>
  );
}
