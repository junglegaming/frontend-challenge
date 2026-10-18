import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { getSafeAuthRedirect } from "../redirect";
import { useAuth } from "@/features/auth/auth-context";
import { useRegister } from "@/features/auth/mutations";
import { AuthModal } from "@/features/auth/components/AuthModal";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { AuthSocialButtons } from "@/features/auth/components/AuthSocialButtons";

export function RegisterPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/register" });
  const { setSession } = useAuth();
  const registerMutation = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setPasswordError(null);

    registerMutation.mutate(
      {
        name,
        email,
        password,
      },
      {
        onSuccess: (response) => {
          setSession(response.user, response.token);

          navigate({
            href: getSafeAuthRedirect(redirect),
          });
        },
      },
    );
  }

  return (
    <AuthModal
      redirect={redirect}
      activeTab="register"
      subtitle="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
      mobileTitle="Criar perfil de colecionador"
      mobileFooter={
        <p>
          Já tem uma conta?{" "}
          <Link
            to="/login"
            search={redirect ? { redirect } : {}}
            className="text-zinc-300 font-bold hover:text-[#d4893f] transition-colors"
          >
            Entre
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nome de usuário */}
        <div>
          <label htmlFor="register-name" className="sr-only">
            Nome de usuário
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome de usuário"
            required
            autoComplete="username"
            className="w-full bg-[#1a110d] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-12 lg:h-10 px-4 lg:px-3 rounded-xl lg:rounded-none focus:outline-none focus:border-[#d4893f]"
          />
        </div>

        {/* E-mail */}
        <div>
          <label htmlFor="register-email" className="sr-only">
            Digite seu e-mail
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Digite seu e-mail"
            required
            autoComplete="email"
            className="w-full bg-[#1a110d] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-12 lg:h-10 px-4 lg:px-3 rounded-xl lg:rounded-none focus:outline-none focus:border-[#d4893f]"
          />
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="register-password" className="sr-only">
            Senha
          </label>
          <PasswordField
            id="register-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder="Senha"
            required
            autoComplete="new-password"
            showToggle
          />
        </div>

        {/* Confirmar senha */}
        <div>
          <label htmlFor="register-confirm-password" className="sr-only">
            Confirmar senha
          </label>
          <PasswordField
            id="register-confirm-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder="Confirmar senha"
            required
            autoComplete="new-password"
            showToggle
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          aria-label="Criar conta"
          disabled={registerMutation.isPending}
          className="w-full bg-[#c88243] hover:bg-[#d4893f] text-[#140d0a] font-bold py-3.5 lg:py-2.5 text-xs rounded-xl lg:rounded-none transition-colors disabled:opacity-50 mt-4 cursor-pointer"
        >
          <span className="lg:hidden">
            {registerMutation.isPending ? "Criando perfil..." : "Criar perfil"}
          </span>
          <span className="hidden lg:inline">
            {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
          </span>
        </button>

        {/* Error message */}
        {(passwordError || registerMutation.isError) && (
          <p role="alert" className="mt-2 text-center text-xs text-red-400">
            {passwordError || "Não foi possível criar a conta."}
          </p>
        )}
      </form>

      {/* Social login buttons */}
      <AuthSocialButtons />
    </AuthModal>
  );
}
