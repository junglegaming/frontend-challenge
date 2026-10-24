import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import {
  coinsAdminErrorMessage,
  loginFormSchema,
  safeCoinsAdminRedirect,
  useCoinsAdminLogin,
  type LoginFormValues,
} from '@/domains/coins-admin'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/page-container'
import { PasswordInput } from '@/shared/ui/password-input'

/**
 * Sign-in of the coins administrator (the real service's admin, not a site user). The access it gives lives in
 * memory only and lasts 15 minutes, so after a reload or when it runs out the person signs in again.
 */
export function AdminCoinsLoginPage({ redirect, reason }: { redirect?: string; reason?: 'expired' }) {
  const navigate = useNavigate()
  const login = useCoinsAdminLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) })

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => void navigate({ to: safeCoinsAdminRedirect(redirect) }),
    })
  })

  return (
    <PageContainer className="flex justify-center py-12">
      <section aria-labelledby="admin-coins-login-title" className="flex w-full max-w-[420px] flex-col gap-6">
        <div>
          <h1 id="admin-coins-login-title" className="text-title font-bold">
            Administração das moedas
          </h1>
          <p className="text-muted-foreground">
            Entre com a conta de administrador do serviço de moedas. Esta conta é diferente da conta do site.
          </p>
        </div>

        {reason === 'expired' && !login.isError && (
          <p role="status" className="rounded-sm border border-border p-3">
            Sua sessão de administrador expirou. Entre de novo.
          </p>
        )}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label="E-mail" required error={errors.email?.message}>
            <Input type="email" autoComplete="username" {...register('email')} />
          </Field>
          <Field label="Senha" required error={errors.password?.message}>
            <PasswordInput autoComplete="current-password" {...register('password')} />
          </Field>
          {login.isError && (
            <p role="alert" className="text-destructive">
              {coinsAdminErrorMessage(login.error)}
            </p>
          )}
          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </section>
    </PageContainer>
  )
}
