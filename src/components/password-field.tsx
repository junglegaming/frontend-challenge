import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "./shared";

export function PasswordField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <Field label={label}>
        <input {...props} type={visible ? "text" : "password"} />
      </Field>
      <button
        type="button"
        aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <Eye size={17} /> : <EyeOff size={17} />}
      </button>
    </div>
  );
}
