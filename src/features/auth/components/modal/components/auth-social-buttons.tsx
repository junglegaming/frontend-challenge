import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import type { AuthModalState } from "./auth-modal-types";

interface AuthSocialButtonsProps {
  auth: AuthModalState;
  className: string;
}

export function AuthSocialButtons({ auth, className }: AuthSocialButtonsProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => auth.handleSocialLogin("google")}
        className={className}
      >
        <FcGoogle size={21} />
        Continuar com Google
      </button>

      <button
        type="button"
        onClick={() => auth.handleSocialLogin("facebook")}
        className={className}
      >
        <FaFacebookF size={19} className="text-[#1877F2]" />
        Continuar com Facebook
      </button>
    </div>
  );
}
