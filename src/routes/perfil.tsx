import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { profileQueryOptions, useChangePassword, useUpdateProfile } from '@/features/account/api'
import { ApiError } from '@/shared/api/http-client'
import {
  type ChangePasswordRequest,
  type UpdateProfileRequest,
  changePasswordRequestSchema,
  updateProfileRequestSchema,
} from '@/shared/contracts'
import { getToken } from '@/shared/session'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

export const Route = createFileRoute('/perfil')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login', search: { redirect: '/perfil' } })
  },
  component: ProfilePage,
})

function ProfilePage() {
  const profileQuery = useQuery(profileQueryOptions())
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const profileForm = useForm<UpdateProfileRequest>({
    resolver: zodResolver(updateProfileRequestSchema),
    values: profileQuery.data
      ? { name: profileQuery.data.name, avatarUrl: profileQuery.data.avatarUrl ?? '' }
      : { name: '', avatarUrl: '' },
  })

  const passwordForm = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordRequestSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  if (profileQuery.isLoading) {
    return <Shell>Carregando perfil…</Shell>
  }

  const profileError = updateProfile.error instanceof ApiError ? updateProfile.error : null
  const passwordError = changePassword.error instanceof ApiError ? changePassword.error : null
  const profile = profileQuery.data

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-[16px] border border-surface-dark bg-surface-card p-5 text-canvas">
          <h2 className="font-mono text-lg font-bold">Dados do colecionador</h2>

          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={profileForm.handleSubmit((values) =>
              updateProfile.mutate({
                name: values.name,
                avatarUrl: values.avatarUrl ? values.avatarUrl : null,
              }),
            )}
            noValidate
          >
            <div className="flex items-center gap-4">
              <span className="inline-flex size-14 items-center justify-center overflow-hidden rounded-full border border-surface-dark bg-surface-raised font-bold">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  (profile?.name ?? '?').slice(0, 1).toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor="avatarUrl" className="text-sm text-text-secondary">
                  URL do avatar
                </label>
                <Input
                  id="avatarUrl"
                  placeholder="https://…"
                  {...profileForm.register('avatarUrl')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="text-sm text-text-secondary">
                Nome
              </label>
              <Input
                id="name"
                aria-invalid={Boolean(profileForm.formState.errors.name)}
                aria-describedby="name-error"
                {...profileForm.register('name')}
              />
              {profileForm.formState.errors.name && (
                <p id="name-error" role="alert" className="mt-1 text-xs text-error">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {profileError && (
              <p role="alert" className="text-sm text-error">
                {profileError.message}
              </p>
            )}

            <Button
              type="submit"
              size="sm"
              className="self-start"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            {updateProfile.isSuccess && (
              <p role="status" className="text-sm text-success">
                Dados atualizados.
              </p>
            )}
          </form>
        </section>

        <section className="rounded-[16px] border border-surface-dark bg-surface-card p-5 text-canvas">
          <h2 className="font-mono text-lg font-bold">Alterar senha</h2>

          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={passwordForm.handleSubmit((values) =>
              changePassword.mutate(values, { onSuccess: () => passwordForm.reset() }),
            )}
            noValidate
          >
            <div>
              <label htmlFor="currentPassword" className="text-sm text-text-secondary">
                Senha atual
              </label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register('currentPassword')}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="text-sm text-text-secondary">
                Nova senha
              </label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                aria-describedby="new-password-error"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p id="new-password-error" role="alert" className="mt-1 text-xs text-error">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {passwordError && (
              <p role="alert" className="text-sm text-error">
                {passwordError.message}
              </p>
            )}

            <Button
              type="submit"
              size="sm"
              className="self-start"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? 'Alterando…' : 'Alterar senha'}
            </Button>
            {changePassword.isSuccess && (
              <p role="status" className="text-sm text-success">
                Senha alterada.
              </p>
            )}
          </form>
        </section>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 xl:px-0">
      <h1 className="mb-6 font-mono text-2xl font-bold text-ink">Perfil do colecionador</h1>
      {children}
    </div>
  )
}
