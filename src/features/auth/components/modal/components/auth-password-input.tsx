import { FiEye, FiEyeOff } from "react-icons/fi";
import type { AuthModalState } from "./auth-modal-types";

interface AuthPasswordInputProps {
  auth: AuthModalState;
  className: string;
}

export function AuthPasswordInput({ auth, className }: AuthPasswordInputProps) {
  return (
    <div className="relative">
      <input
        type={auth.showPassword ? "text" : "password"}
        placeholder="Senha"
        autoComplete={
          auth.mode === "login" ? "current-password" : "new-password"
        }
        value={auth.password}
        onChange={(event) => auth.changePassword(event.target.value)}
        className={`${className} pr-12`}
      />

      <button
        type="button"
        onClick={() => auth.setShowPassword((value) => !value)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#e6a45e] transition-colors hover:bg-[#59301f]/50 hover:text-[#ffc184]"
        aria-label={auth.showPassword ? "Ocultar senha" : "Mostrar senha"}
      >
        {auth.showPassword ? <FiEye size={19} /> : <FiEyeOff size={19} />}
      </button>
    </div>
  );
}
