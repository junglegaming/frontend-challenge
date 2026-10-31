import { AuthForm } from "./components/auth-form";
import type { AuthModalState } from "./components/auth-modal-types";
import { AuthSocialButtons } from "./components/auth-social-buttons";

interface AuthModalMobileProps {
  auth: AuthModalState;
}

export function AuthModalMobile({ auth }: AuthModalMobileProps) {
  const isLogin = auth.mode === "login";

  const inputClassName =
    "h-[50px] w-full rounded-xl border border-[#59301f] bg-[#160e0b] px-4 font-mono text-sm text-[#eee5df] outline-none transition-colors placeholder:text-[#b58b5b] focus:border-[#d9904b] focus:ring-1 focus:ring-[#d9904b]/30";

  const submitClassName =
    "mt-7 h-[60px] w-full rounded-xl bg-[#d9904b] font-mono text-sm font-bold text-[#1c110d] transition-colors hover:bg-[#eda45f] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

  const socialClassName =
    "flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[#59301f] bg-transparent font-mono text-xs text-[#c9a985] transition-colors hover:border-[#d9904b] hover:bg-[#2b1b14]";

  function toggleMode() {
    auth.changeMode(isLogin ? "register" : "login");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Autenticação Kurio"
      className="flex h-full min-h-full w-full flex-col overflow-y-auto bg-[#130c09] px-7 py-10 text-[#eee5df]"
    >
      <div className="my-auto w-full">
        <header className="mb-14 text-center">
          <h1 className="mb-16 font-sans text-3xl font-extrabold tracking-[0.12em] text-[#f1eae3]">
            KURIO
          </h1>

          <h2 className="font-mono text-xl font-bold">
            {isLogin ? "Entrar" : "Criar conta"}
          </h2>
        </header>

        <AuthForm
          auth={auth}
          inputClassName={inputClassName}
          submitClassName={submitClassName}
          onSubmit={auth.handleSubmit}
        />

        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#59301f]" />

          <span className="whitespace-nowrap font-mono text-xs text-[#eee5df]">
            Ou continue com
          </span>

          <div className="h-px flex-1 bg-[#59301f]" />
        </div>

        <AuthSocialButtons auth={auth} className={socialClassName} />
      </div>

      <footer className="mt-10 text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="font-mono text-sm text-[#c9a985] transition-colors hover:text-[#f0a052]"
        >
          {isLogin ? "Novo na Kurio? Crie uma conta" : "Já tem conta? Entre"}
        </button>
      </footer>
    </div>
  );
}
