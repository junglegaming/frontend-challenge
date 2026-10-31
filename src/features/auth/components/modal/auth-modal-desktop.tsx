import { AuthForm } from "./components/auth-form";
import type { AuthModalState } from "./components/auth-modal-types";
import { AuthSocialButtons } from "./components/auth-social-buttons";

interface AuthModalDesktopProps {
  auth: AuthModalState;
}

export function AuthModalDesktop({ auth }: AuthModalDesktopProps) {
  const isLogin = auth.mode === "login";

  const inputClassName =
    "h-11 w-full rounded-lg border border-[#59301f] bg-[#1a100c] px-4 font-mono text-sm text-[#eee5df] outline-none transition-colors placeholder:text-[#a98265] focus:border-[#df914e] focus:ring-1 focus:ring-[#df914e]/30";

  const submitClassName =
    "h-12 w-full rounded-lg bg-[#d9904b] font-mono text-sm font-bold text-[#1c110d] transition-colors hover:bg-[#eda45f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

  const socialClassName =
    "flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#59301f] bg-[#2b1b14] font-mono text-xs text-[#eee5df] transition-colors hover:border-[#d9904b] hover:bg-[#382319] active:scale-[0.99] sm:text-sm";

  return (
    <div className="relative my-auto w-full max-w-[500px] overflow-y-auto rounded-2xl border border-[#59301f] bg-[#241510] px-10 pb-10 pt-9 text-[#eee5df] shadow-2xl">
      <div className="mb-8 flex items-center justify-center gap-3 pt-2 font-mono text-xl">
        <button
          type="button"
          onClick={() => auth.changeMode("login")}
          aria-pressed={isLogin}
          className={
            isLogin
              ? "font-bold text-[#f0a052]"
              : "text-[#eee5df] transition-colors hover:text-[#f0a052]"
          }
        >
          Entrar
        </button>

        <span className="text-[#9b6847]">|</span>

        <button
          type="button"
          onClick={() => auth.changeMode("register")}
          aria-pressed={!isLogin}
          className={
            !isLogin
              ? "font-bold text-[#f0a052]"
              : "text-[#eee5df] transition-colors hover:text-[#f0a052]"
          }
        >
          Criar conta
        </button>
      </div>

      <p className="mb-8 text-center font-mono text-sm leading-6 text-[#e4d8cf]">
        {isLogin
          ? "Entre para gerenciar sua carteira, coleção e perfil de criador."
          : "Crie sua conta para gerenciar sua carteira, coleção e perfil de criador."}
      </p>

      <AuthForm
        auth={auth}
        inputClassName={inputClassName}
        submitClassName={submitClassName}
        onSubmit={auth.handleSubmit}
      />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#59301f]" />

        <span className="whitespace-nowrap font-mono text-xs text-[#c9a985]">
          Ou continue com
        </span>

        <div className="h-px flex-1 bg-[#59301f]" />
      </div>

      <AuthSocialButtons auth={auth} className={socialClassName} />

      <div className="absolute bottom-0 left-0 h-1.5 w-full rounded-b-2xl bg-gradient-to-r from-[#b86b35] via-[#f0a052] to-[#b86b35]" />
    </div>
  );
}
