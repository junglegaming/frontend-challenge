import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { errorMessage } from '@/components/common/ErrorState'
import { FieldError } from '@/components/common/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegister } from '@/hooks/useSession'
import { registerInputSchema, type RegisterInput } from '@/schemas/auth'
import { applyApiFieldErrors } from './api-field-errors'
import { PasswordInput } from './PasswordInput'

const fieldClass = 'h-[50px] rounded-xl border-border bg-background/40 pl-4 text-[13px] md:h-10 md:rounded-sm md:text-sm'
const fields = ['username', 'email', 'password', 'confirmPassword'] as const

interface SignupFormProps {
  onSuccess: () => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const registerAccount = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    registerAccount.mutate(values, {
      onSuccess,
      onError: (error) => {
        const applied = applyApiFieldErrors(error, form.setError, fields)
        if (!applied) setFormError(errorMessage(error, 'Não foi possível criar sua conta. Tente novamente.'))
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
        <Label htmlFor="signup-username" className="sr-only">
          Nome de usuário
        </Label>
        <Input
          id="signup-username"
          placeholder="Nome de usuário"
          autoComplete="username"
          className={fieldClass}
          aria-invalid={Boolean(form.formState.errors.username)}
          aria-describedby={form.formState.errors.username ? 'signup-username-error' : undefined}
          {...form.register('username')}
        />
        <FieldError id="signup-username-error" message={form.formState.errors.username?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email" className="sr-only">
          E-mail
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="Digite seu e-mail"
          autoComplete="email"
          className={fieldClass}
          aria-invalid={Boolean(form.formState.errors.email)}
          aria-describedby={form.formState.errors.email ? 'signup-email-error' : undefined}
          {...form.register('email')}
        />
        <FieldError id="signup-email-error" message={form.formState.errors.email?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password" className="sr-only">
          Senha
        </Label>
        <PasswordInput
          id="signup-password"
          placeholder="Senha"
          autoComplete="new-password"
          className={fieldClass}
          aria-invalid={Boolean(form.formState.errors.password)}
          aria-describedby={form.formState.errors.password ? 'signup-password-error' : undefined}
          {...form.register('password')}
        />
        <FieldError id="signup-password-error" message={form.formState.errors.password?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-confirm-password" className="sr-only">
          Confirmar senha
        </Label>
        <PasswordInput
          id="signup-confirm-password"
          placeholder="Confirmar senha"
          autoComplete="new-password"
          className={fieldClass}
          aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          aria-describedby={form.formState.errors.confirmPassword ? 'signup-confirm-password-error' : undefined}
          {...form.register('confirmPassword')}
        />
        <FieldError id="signup-confirm-password-error" message={form.formState.errors.confirmPassword?.message} />
      </div>

      <Button type="submit" disabled={registerAccount.isPending} className="mt-7 h-[60px] w-full rounded-xl text-base md:mt-3 md:h-[45px] md:rounded-sm">
        {registerAccount.isPending ? (
          'Criando…'
        ) : (
          <>
            <span className="md:hidden">Criar perfil</span>
            <span className="hidden md:inline">Criar conta</span>
          </>
        )}
      </Button>
    </form>
  )
}
