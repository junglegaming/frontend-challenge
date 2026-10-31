import { useState } from "react";
import { loginSchema, registerSchema } from "../schemas/auth-schema";
import { useLogin } from "./use-login";
import { useRegister } from "./use-register";

type AuthMode = "login" | "register";

interface AuthModalErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function useAuthModal(onSuccess: () => void) {
  const login = useLogin();
  const register = useRegister();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldError, setFieldError] = useState<AuthModalErrors>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isLoading = login.isPending || register.isPending;

  function clearMessages() {
    setFieldError({});
    setError("");
    setNotice("");
  }

  function changeMode(newMode: AuthMode) {
    setMode(newMode);

    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);

    setFieldError({});
    setError("");
    setNotice("");
  }
  
  function changeName(value: string) {
    setName(value);
    setFieldError((prev) => ({ ...prev, name: undefined }));
  }

  function changeEmail(value: string) {
    setEmail(value);
    setFieldError((prev) => ({ ...prev, email: undefined }));
  }

  function changePassword(value: string) {
    setPassword(value);
    setFieldError((prev) => ({ ...prev, password: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearMessages();

    try {
      if (mode === "login") {
        const validation = loginSchema.safeParse({
          email,
          password,
        });

        if (!validation.success) {
          const errors: AuthModalErrors = {};

          for (const issue of validation.error.issues) {
            const field = issue.path[0];

            if ((field === "email" || field === "password") && !errors[field]) {
              errors[field] = issue.message;
            }
          }

          setFieldError(errors);
          return;
        }

        await login.mutateAsync(validation.data);
      } else {
        const validation = registerSchema.safeParse({
          name,
          email,
          password,
        });

        if (!validation.success) {
          const errors: AuthModalErrors = {};

          for (const issue of validation.error.issues) {
            const field = issue.path[0];

            if (
              (field === "name" || field === "email" || field === "password") &&
              !errors[field]
            ) {
              errors[field] = issue.message;
            }
          }

          setFieldError(errors);
          return;
        }

        await register.mutateAsync(validation.data);
      }

      onSuccess();
    } catch (err) {
      const apiError = err as ApiError;

      setError(
        apiError.response?.data?.message ??
          "Não foi possível realizar a autenticação. Tente novamente.",
      );
    }
  }

  function handleForgotPassword() {
    clearMessages();
    setNotice("A recuperação de senha estará disponível em breve.");
  }

  function handleSocialLogin(provider: "google" | "facebook") {
    clearMessages();
    setNotice(
      `A autenticação com ${provider === "google" ? "Google" : "Facebook"} estará disponível em breve.`,
    );
  }

  return {
    mode,
    name,
    email,
    password,
    showPassword,
    fieldError,
    error,
    notice,
    isLoading,

    setShowPassword,
    changeMode,
    changeName,
    changeEmail,
    changePassword,

    handleSubmit,
    handleForgotPassword,
    handleSocialLogin,
  };
}

export type AuthModalState = ReturnType<typeof useAuthModal>;
