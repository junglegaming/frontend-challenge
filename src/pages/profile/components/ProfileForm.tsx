import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { z } from 'zod'
import { ENS_TLDS, useChangePassword, useUpdateProfile, type Profile } from '@/domains/profile'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PasswordInput } from '@/shared/ui/password-input'
import { Select } from '@/shared/ui/select'
import { AlertIcon } from '@/shared/icons'
import { AvatarEditor } from './AvatarEditor'

const schema = z
  .object({
    name: z.string().trim().min(3, 'Informe pelo menos 3 caracteres.').max(60, 'Use no máximo 60 caracteres.'),
    username: z.string().regex(/^[a-z0-9_]{3,20}$/, 'Use de 3 a 20 caracteres: letras minúsculas, números ou _.'),
    email: z.email('Informe um e-mail válido.'),
    ensName: z.string().regex(/^[a-z0-9][a-z0-9-]{2,39}$/, 'Use de 3 a 40 letras minúsculas, números ou hífen.'),
    ensTld: z.enum(ENS_TLDS),
    walletNickname: z.string().trim().min(1, 'Informe um apelido para a carteira.').max(40, 'Use no máximo 40 caracteres.'),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    const changing = v.currentPassword || v.newPassword || v.confirmPassword
    if (!changing) return
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    if (!v.currentPassword) issue('currentPassword', 'Informe a senha atual.')
    if (v.newPassword.length < 8) issue('newPassword', 'A senha precisa de pelo menos 8 caracteres.')
    else if (!/[A-Za-z]/.test(v.newPassword) || !/\d/.test(v.newPassword)) issue('newPassword', 'Use letras e números na senha.')
    if (v.confirmPassword !== v.newPassword) issue('confirmPassword', 'As senhas não coincidem.')
  })

type FormValues = z.infer<typeof schema>

const PASSWORD_FIELDS = { currentPassword: '', newPassword: '', confirmPassword: '' }

const toValues = (p: Profile): FormValues => ({
  name: p.name,
  username: p.username,
  email: p.email,
  ensName: p.ensName,
  ensTld: p.ensTld,
  walletNickname: p.walletNickname,
  ...PASSWORD_FIELDS,
})

export function ProfileForm({ profile }: { profile: Profile }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(profile) })
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string }>()
  const saving = updateProfile.isPending || changePassword.isPending

  /** Maps API field errors (422/409) onto the form; returns whether any field matched. */
  function applyApiErrors(error: unknown) {
    if (!isApiError(error)) return setStatus({ kind: 'error', message: 'Não foi possível salvar. Tente novamente.' })
    const known = Object.entries(error.fields).filter(([name]) => name in schema.shape)
    known.forEach(([name, message]) => setError(name as Path<FormValues>, { type: 'server', message }))
    if (known.length > 0) setFocus(known[0][0] as Path<FormValues>)
    setStatus({ kind: 'error', message: known.length > 0 ? 'Corrija os campos destacados.' : error.message })
  }

  async function onSubmit(values: FormValues) {
    setStatus(undefined)
    try {
      const saved = await updateProfile.mutateAsync({
        name: values.name,
        username: values.username,
        email: values.email,
        bio: profile.bio,
        ensName: values.ensName,
        ensTld: values.ensTld,
        walletNickname: values.walletNickname,
      })
      if (values.currentPassword) {
        await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      }
      reset(toValues(saved))
      setStatus({ kind: 'success', message: 'Alterações salvas.' })
    } catch (error) {
      applyApiErrors(error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
        <Field label="Nome de exibição" required error={errors.name?.message}>
          <Input autoComplete="name" {...register('name')} />
        </Field>
        <Field label="Nome de usuário" required error={errors.username?.message}>
          <Input autoComplete="username" {...register('username')} />
        </Field>
        <Field label="E-mail" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <div className="flex flex-col gap-2">
          <Label id="ens-label" htmlFor="ens-name" required>
            Nome ENS
          </Label>
          <div className="flex gap-2" role="group" aria-labelledby="ens-label">
            <Select aria-label="Domínio ENS" className="w-[92px] shrink-0" {...register('ensTld')}>
              {ENS_TLDS.map((tld) => (
                <option key={tld} value={tld}>
                  {tld}
                </option>
              ))}
            </Select>
            <Input
              id="ens-name"
              aria-invalid={errors.ensName ? true : undefined}
              aria-describedby={errors.ensName ? 'ens-error' : undefined}
              {...register('ensName')}
            />
          </div>
          {errors.ensName && (
            <p id="ens-error" role="alert" className="flex items-start gap-1 text-caption text-destructive">
              <AlertIcon aria-hidden="true" strokeWidth={1.5} size={14} className="mt-0.5 shrink-0" />
              {errors.ensName.message}
            </p>
          )}
        </div>
        <Field label="Apelido da carteira" required error={errors.walletNickname?.message}>
          <Input {...register('walletNickname')} />
        </Field>
        <AvatarEditor avatarUrl={profile.avatarUrl} />
      </div>

      <fieldset className="flex flex-col gap-6 md:max-w-[calc(50%-1.5rem)]">
        <legend className="mb-6 text-title font-bold">Alterar senha</legend>
        <Field label="Senha atual" error={errors.currentPassword?.message}>
          <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
        </Field>
        <Field label="Nova senha" error={errors.newPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register('newPassword')} />
        </Field>
        <Field label="Confirmar nova senha" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
        </Field>
      </fieldset>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
        <p
          role={status?.kind === 'error' ? 'alert' : 'status'}
          className={status?.kind === 'error' ? 'text-body text-destructive' : 'text-body text-success'}
        >
          {status?.message}
        </p>
      </div>
    </form>
  )
}
