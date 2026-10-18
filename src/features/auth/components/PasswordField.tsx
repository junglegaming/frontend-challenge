import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
  showToggle?: boolean;
}

export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  required = true,
  autoComplete,
  showToggle = true,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full bg-[#1a110d] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-500 h-12 lg:h-10 px-4 lg:px-3 pr-10 rounded-xl lg:rounded-none focus:outline-none focus:border-[#d4893f]"
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#d4893f] transition-colors"
        >
          {showPassword ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
