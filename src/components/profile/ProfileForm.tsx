import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ChevronDown, UserRound } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { applyApiFieldErrors } from '@/components/auth/api-field-errors'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { errorMessage } from '@/components/common/ErrorState'
import { FieldError } from '@/components/common/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword, useUpdateProfile } from '@/hooks/useAccount'
import { avatarSchema, changePasswordInputSchema, updateProfileInputSchema, type Profile } from '@/schemas/profile'

const fieldClass = 'h-12 rounded-xl border-border bg-background/40 md:h-10 md:rounded-sm'
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const AVATAR_MAX_BYTES = 1024 * 1024
const PROFILE_FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const
const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const
const PROFILE_ERROR_FIELDS = [...PROFILE_FIELDS, 'avatar'] as const

// Um único formulário: a senha só é validada (e enviada) quando algum dos três campos está preenchido.
const profileFormSchema = updateProfileInputSchema
  .extend({ currentPassword: z.string(), newPassword: z.string(), confirmPassword: z.string() })
  .superRefine((data, ctx) => {
    if (!PASSWORD_FIELDS.some((field) => data[field])) return
    const parsed = changePasswordInputSchema.safeParse({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    })
    if (parsed.success) return
    for (const issue of parsed.error.issues) ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
  })
type ProfileFormValues = z.infer<typeof profileFormSchema>

function toFormValues(profile: Profile) {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    walletNickname: profile.walletNickname,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Falha ao ler a imagem')))
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler a imagem'))
    reader.readAsDataURL(file)
  })
}

interface PasswordFieldProps {
  form: UseFormReturn<ProfileFormValues>
  name: (typeof PASSWORD_FIELDS)[number]
  id: string
  label: string
  autoComplete: string
}

function PasswordField({ form, name, id, label, autoComplete }: PasswordFieldProps) {
  const error = form.formState.errors[name]?.message
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      <PasswordInput
        id={id}
        autoComplete={autoComplete}
        className={fieldClass}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...form.register(name)}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const fileInput = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<string | null>(profile.avatar)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(profile),
  })

  const values = useWatch({ control: form.control })
  const pending = updateProfile.isPending || changePassword.isPending
  const avatarChanged = avatar !== profile.avatar
  const profileChanged = avatarChanged || PROFILE_FIELDS.some((field) => values[field] !== profile[field])
  const passwordFilled = PASSWORD_FIELDS.some((field) => values[field])
  const saveDisabled = pending || !(profileChanged || passwordFilled)

  const onSubmit = form.handleSubmit(async (formValues) => {
    setFormError(null)
    form.clearErrors('avatar')
    const { currentPassword, newPassword, confirmPassword, ...profileValues } = formValues
    const sendProfile = avatar !== profile.avatar || PROFILE_FIELDS.some((field) => profileValues[field] !== profile[field])
    const sendPassword = PASSWORD_FIELDS.some((field) => formValues[field])

    const [profileResult, passwordResult] = await Promise.allSettled([
      sendProfile ? updateProfile.mutateAsync({ ...profileValues, avatar }) : Promise.resolve(undefined),
      sendPassword ? changePassword.mutateAsync({ currentPassword, newPassword, confirmPassword }) : Promise.resolve(undefined),
    ])

    const errors: string[] = []
    if (profileResult.status === 'fulfilled' && profileResult.value) setAvatar(profileResult.value.avatar)
    if (profileResult.status === 'rejected' && !applyApiFieldErrors(profileResult.reason, form.setError, PROFILE_ERROR_FIELDS)) {
      errors.push(errorMessage(profileResult.reason, 'Não foi possível salvar o perfil. Tente novamente.'))
    }
    if (passwordResult.status === 'rejected') {
      const error = passwordResult.reason
      if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
        form.setError('currentPassword', { type: 'server', message: 'Senha atual incorreta' })
      } else if (!applyApiFieldErrors(error, form.setError, PASSWORD_FIELDS)) {
        errors.push(errorMessage(error, 'Não foi possível alterar a senha. Tente novamente.'))
      }
    }
    if (errors.length > 0) setFormError(errors.join(' '))

    const profileSaved = sendProfile && profileResult.status === 'fulfilled'
    const passwordSaved = sendPassword && passwordResult.status === 'fulfilled'
    if (passwordSaved) PASSWORD_FIELDS.forEach((field) => form.resetField(field))
    if (profileSaved && passwordSaved) toast.success('Perfil atualizado e senha alterada')
    else if (profileSaved) toast.success('Perfil atualizado')
    else if (passwordSaved) toast.success('Senha alterada')
  })

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      form.setError('avatar', { type: 'manual', message: 'Use uma imagem PNG, JPEG, WebP ou GIF' })
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      form.setError('avatar', { type: 'manual', message: 'A imagem deve ter no máximo 1 MB' })
      return
    }
    try {
      const dataUrl = await readAsDataUrl(file)
      const parsed = avatarSchema.safeParse(dataUrl)
      if (!parsed.success) {
        form.setError('avatar', { type: 'manual', message: parsed.error.issues[0]?.message ?? 'Imagem inválida' })
        return
      }
      form.clearErrors('avatar')
      setAvatar(parsed.data)
    } catch {
      form.setError('avatar', { type: 'manual', message: 'Não foi possível ler a imagem' })
    }
  }

  function removeAvatar() {
    form.clearErrors('avatar')
    setAvatar(null)
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col">
      {formError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <Label htmlFor="profile-display-name" className="h-[29px] font-normal">
            Nome de exibição <span className="text-primary" aria-hidden="true">*</span>
          </Label>
          <Input
            id="profile-display-name"
            className={fieldClass}
            aria-invalid={Boolean(form.formState.errors.displayName)}
            aria-describedby={form.formState.errors.displayName ? 'profile-display-name-error' : undefined}
            {...form.register('displayName')}
          />
          <FieldError id="profile-display-name-error" message={form.formState.errors.displayName?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="profile-username" className="h-[29px] font-normal">
            Nome de usuário <span className="text-primary" aria-hidden="true">*</span>
          </Label>
          <Input
            id="profile-username"
            autoComplete="username"
            className={fieldClass}
            aria-invalid={Boolean(form.formState.errors.username)}
            aria-describedby={form.formState.errors.username ? 'profile-username-error' : undefined}
            {...form.register('username')}
          />
          <FieldError id="profile-username-error" message={form.formState.errors.username?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="profile-email" className="h-[29px] font-normal">
            E-mail <span className="text-primary" aria-hidden="true">*</span>
          </Label>
          <Input
            id="profile-email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={form.formState.errors.email ? 'profile-email-error' : undefined}
            {...form.register('email')}
          />
          <FieldError id="profile-email-error" message={form.formState.errors.email?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="profile-ens" className="h-[29px] font-normal">
            Nome ENS <span className="text-primary" aria-hidden="true">*</span>
          </Label>
          <div className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-12 w-[78px] shrink-0 items-center justify-between rounded-xl border border-border bg-background/40 px-2.5 text-sm text-muted-foreground md:h-10 md:rounded-sm"
            >
              .eth
              <ChevronDown className="size-5" />
            </span>
            <Input
              id="profile-ens"
              className={`${fieldClass} min-w-0 flex-1`}
              aria-invalid={Boolean(form.formState.errors.ensName)}
              aria-describedby={form.formState.errors.ensName ? 'profile-ens-error' : undefined}
              {...form.register('ensName')}
            />
          </div>
          <FieldError id="profile-ens-error" message={form.formState.errors.ensName?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="profile-wallet-nickname" className="h-[29px] font-normal">
            Apelido da carteira <span className="text-primary" aria-hidden="true">*</span>
          </Label>
          <Input
            id="profile-wallet-nickname"
            className={fieldClass}
            aria-invalid={Boolean(form.formState.errors.walletNickname)}
            aria-describedby={form.formState.errors.walletNickname ? 'profile-wallet-nickname-error' : undefined}
            {...form.register('walletNickname')}
          />
          <FieldError id="profile-wallet-nickname-error" message={form.formState.errors.walletNickname?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <p id="profile-avatar-label" className="flex h-[29px] items-center text-sm">
            Avatar
          </p>
          <div role="group" aria-labelledby="profile-avatar-label" className="flex flex-wrap items-center gap-4">
            <span className="grid size-[50px] place-items-center overflow-hidden rounded-full border border-border-soft bg-surface-dark text-muted-foreground">
              {avatar ? (
                <img src={avatar} alt={avatarChanged ? 'Prévia do novo avatar' : 'Avatar atual'} className="size-full object-cover" />
              ) : (
                <UserRound className="size-6" aria-hidden="true" />
              )}
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-label="Selecionar imagem de avatar"
              onChange={handleFile}
            />
            <Button
              type="button"
              className="w-[98px]"
              onClick={() => fileInput.current?.click()}
              aria-describedby={form.formState.errors.avatar ? 'avatar-help profile-avatar-error' : 'avatar-help'}
            >
              Alterar
            </Button>
            <Button type="button" variant="ghost" onClick={removeAvatar} disabled={!avatar} className="text-foreground">
              Remover
            </Button>
          </div>
          <p id="avatar-help" className="text-xs text-muted-foreground">
            PNG, JPEG, WebP ou GIF até 1 MB.
          </p>
          <FieldError id="profile-avatar-error" message={form.formState.errors.avatar?.message} />
        </div>
      </div>

      <section aria-labelledby="profile-password-title" className="mt-8 flex flex-col gap-6 md:max-w-[417px]">
        <h2 id="profile-password-title" className="text-base font-bold">
          Alterar senha
        </h2>
        <PasswordField form={form} name="currentPassword" id="current-password" label="Senha atual" autoComplete="current-password" />
        <PasswordField form={form} name="newPassword" id="new-password" label="Nova senha" autoComplete="new-password" />
        <PasswordField form={form} name="confirmPassword" id="confirm-new-password" label="Confirmar nova senha" autoComplete="new-password" />
      </section>

      <Button type="submit" disabled={saveDisabled} className="mt-8 h-10 w-fit px-10">
        {pending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
