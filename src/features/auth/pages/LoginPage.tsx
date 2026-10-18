import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { getSafeAuthRedirect } from "../redirect";
import { useAuth } from "@/features/auth/auth-context";
import { useLogin } from "@/features/auth/mutations";
import { AuthModal } from "@/features/auth/components/AuthModal";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { AuthSocialButtons } from "@/features/auth/components/AuthSocialButtons";

export function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { setSession } = useAuth();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    loginMutation.mutate(
      {
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
      activeTab="login"
      subtitle="Entre para gerenciar sua carteira, coleção e perfil de criador."
      mobileTitle="Entrar"
      mobileFooter={
        <p>
          Novo na Kurio?{" "}
          <Link
            to="/register"
            search={redirect ? { redirect } : {}}
            className="text-zinc-300 font-bold hover:text-[#d4893f] transition-colors"
          >
            Crie uma conta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email field */}
        <div>
          <label htmlFor="login-email" className="sr-only">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="contato@email.com"
            required
            autoComplete="email"
            className="w-full bg-[#1a110d] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-12 lg:h-10 px-4 lg:px-3 rounded-xl lg:rounded-none focus:outline-none focus:border-[#d4893f]"
          />
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="login-password" className="sr-only">
            Senha
          </label>
          <PasswordField
            id="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="************"
            required
            autoComplete="current-password"
            showToggle
          />
        </div>

        {/* Forgot password link */}
        <div className="text-right pt-0.5">
          <button
            type="button"
            className="text-[11px] text-[#d4893f] hover:underline"
          >
            Esqueceu a senha?
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-[#c88243] hover:bg-[#d4893f] text-[#140d0a] font-bold py-3.5 lg:py-2.5 text-xs rounded-xl lg:rounded-none transition-colors disabled:opacity-50 mt-4 lg:mt-3 cursor-pointer"
        >
          {loginMutation.isPending ? "Entrando..." : "Entrar"}
        </button>

        {/* Error message */}
        {loginMutation.isError && (
          <p role="alert" className="mt-2 text-center text-xs text-red-400">
            E-mail ou senha inválidos.
          </p>
        )}
      </form>

      {/* Social login buttons */}
      <AuthSocialButtons />
    </AuthModal>
  );
}
