import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/shared/FormTextField';
import { useSession } from '@/lib/session/state';
import {
  loginFormSchema,
  signupFormSchema,
  type LoginFormValues,
  type SignupFormValues,
} from '../form-schema';
import { useAuthSubmit } from '../hooks/useAuthSubmit';

function FormFeedback({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {message && (
        <p role="alert" className="text-coral text-body-sm">
          <span aria-hidden="true">⚠ </span>
          {message}
        </p>
      )}
    </div>
  );
}

export function LoginForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const { login } = useSession();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: 'ana@nft-marketplace.test', password: 'Ana12345' },
  });
  const { submit, isPending, message } = useAuthSubmit(form, login, onSuccess);
  return (
    <Form {...form}>
      <form
        onSubmit={submit}
        noValidate
        className="grid gap-3"
        aria-label="Formulário de login"
        aria-busy={isPending}
      >
        <fieldset disabled={isPending} className="grid min-w-0 gap-3">
          <FormTextField
            control={form.control}
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
          />
          <FormTextField
            control={form.control}
            name="password"
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
          />
          <button
            type="button"
            disabled
            aria-describedby="auth-unavailable"
            className="text-text-accent text-caption justify-self-end"
          >
            Esqueceu a senha?
          </button>
        </fieldset>
        <FormFeedback message={message} />
        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="mt-3 h-14 w-full md:h-11"
        >
          {isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </Form>
  );
}

export function SignupForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const { signup } = useSession();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: 'Ana',
      email: 'ana@nft-marketplace.test',
      password: 'Ana12345',
      confirmPassword: 'Ana12345',
    },
  });
  const { submit, isPending, message } = useAuthSubmit(
    form,
    (input) =>
      signup({
        name: input.name,
        email: input.email,
        password: input.password,
      }),
    onSuccess
  );
  return (
    <Form {...form}>
      <form
        onSubmit={submit}
        noValidate
        className="grid gap-3"
        aria-label="Formulário de cadastro"
        aria-busy={isPending}
      >
        <fieldset disabled={isPending} className="grid min-w-0 gap-3">
          <FormTextField
            control={form.control}
            name="name"
            label="Nome"
            autoComplete="name"
            placeholder="Nome de usuário"
          />
          <FormTextField
            control={form.control}
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
          />
          <FormTextField
            control={form.control}
            name="password"
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="Senha"
            description="Use pelo menos 8 caracteres, com letra e número."
          />
          <FormTextField
            control={form.control}
            name="confirmPassword"
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar senha"
          />
        </fieldset>
        <FormFeedback message={message} />
        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="mt-3 h-14 w-full md:h-11"
        >
          {isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
    </Form>
  );
}
