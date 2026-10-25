import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { errorMessage } from '@/components/common/ErrorState'
import { FieldError } from '@/components/common/FieldError'
import { ComingSoon } from '@/components/common/ComingSoon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/useSession'
import { loginInputSchema, type LoginInput } from '@/schemas/auth'
import { applyApiFieldErrors } from './api-field-errors'
import { PasswordInput } from './PasswordInput'

const fieldClass = 'h-[50px] rounded-xl border-border bg-background/40 pl-4 text-[13px] md:h-10 md:rounded-sm md:text-sm'

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess,
      onError: (error) => {
        const applied = applyApiFieldErrors(error, form.setError, ['email', 'password'])
        if (!applied) setFormError(errorMessage(error, 'Não foi possível entrar. Tente novamente.'))
      },
    })
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email" className="sr-only">
          E-mail
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="contato@email.com"
          autoComplete="email"
          className={fieldClass}
          aria-invalid={Boolean(form.formState.errors.email)}
          aria-describedby={form.formState.errors.email ? 'login-email-error' : undefined}
          {...form.register('email')}
        />
        <FieldError id="login-email-error" message={form.formState.errors.email?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password" className="sr-only">
          Senha
        </Label>
        <PasswordInput
          id="login-password"
          placeholder="Senha"
          autoComplete="current-password"
          className={fieldClass}
          aria-invalid={Boolean(form.formState.errors.password)}
          aria-describedby={form.formState.errors.password ? 'login-password-error' : undefined}
          {...form.register('password')}
        />
        <FieldError id="login-password-error" message={form.formState.errors.password?.message} />
      </div>

      <p className="text-right text-[13px] text-accent-text">
        <ComingSoon muted={false}>Esqueceu a senha?</ComingSoon>
      </p>

      <Button type="submit" disabled={login.isPending} className="mt-7 h-[60px] w-full rounded-xl text-base md:mt-3 md:h-[45px] md:rounded-sm">
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
