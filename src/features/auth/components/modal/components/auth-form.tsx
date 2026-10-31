import type { FormEventHandler } from "react";
import type { AuthModalState } from "./auth-modal-types";
import { AuthPasswordInput } from "./auth-password-input";

interface AuthFormProps {
  auth: AuthModalState;
  inputClassName: string;
  submitClassName: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function AuthForm({
  auth,
  inputClassName,
  submitClassName,
  onSubmit,
}: AuthFormProps) {
  const isLogin = auth.mode === "login";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {!isLogin && (
        <input
          type="text"
          placeholder="Nome completo"
          autoComplete="name"
          value={auth.name}
          onChange={(event) => auth.changeName(event.target.value)}
          className={inputClassName}
        />
      )}

      <input
        type="email"
        placeholder="contato@email.com"
        autoComplete="email"
        value={auth.email}
        onChange={(event) => auth.changeEmail(event.target.value)}
        className={inputClassName}
      />

      <AuthPasswordInput auth={auth} className={inputClassName} />

      {Object.values(auth.fieldError).some(Boolean) && (
        <div role="alert" className="space-y-1">
          {Object.entries(auth.fieldError).map(([field, message]) =>
            message ? (
              <p key={field} className="text-xs text-red-400">
                {message}
              </p>
            ) : null,
          )}
        </div>
      )}

      {auth.error && (
        <p role="alert" className="text-xs text-red-400">
          {auth.error}
        </p>
      )}

      {auth.notice && (
        <p role="status" className="text-xs text-[#e9ad6c]">
          {auth.notice}
        </p>
      )}

      {isLogin && (
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={auth.handleForgotPassword}
            className="font-mono text-xs text-[#e99a54] transition-colors hover:text-[#ffc184] sm:text-sm"
          >
            Esqueceu a senha?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={auth.isLoading}
        className={submitClassName}
      >
        {auth.isLoading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}
