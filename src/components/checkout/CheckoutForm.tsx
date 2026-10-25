import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { FieldError } from '@/components/common/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NETWORK_LABELS } from '@/schemas/common'
import { WALLET_PROVIDER_LABELS, type Wallet } from '@/schemas/wallet'
import { cn } from '@/lib/utils'
import { checkoutFormSchema, type CheckoutFormValues } from './checkout-form-schema'

interface CheckoutFormProps {
  formId: string
  defaultValues: CheckoutFormValues
  wallet: Wallet | null
  otherWallet: Wallet | null
  usingOtherWallet: boolean
  onToggleOtherWallet: () => void
  disabled?: boolean
  onValuesChange: (values: Partial<CheckoutFormValues>) => void
  onSubmit: (values: CheckoutFormValues) => void
}

function RequiredMark() {
  return (
    <>
      <span className="text-primary" aria-hidden="true">
        *
      </span>
      <span className="sr-only"> (obrigatório)</span>
    </>
  )
}

const fieldClass = 'h-11 rounded-sm placeholder:text-subtle md:h-10'
const labelClass = 'text-sm'
const selectClass =
  'h-11 w-full appearance-none rounded-sm border border-input bg-transparent px-2.5 pr-8 text-sm text-foreground outline-none disabled:cursor-default disabled:text-foreground disabled:opacity-100 md:h-10'

function ReadOnlySelect({
  id,
  value,
  onChangePlaceholder,
  children,
}: {
  id: string
  value: string
  onChangePlaceholder?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select id={id} value={value} disabled className={cn(selectClass, !value && 'text-subtle')}>
        {onChangePlaceholder && (
          <option value="" disabled>
            {onChangePlaceholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    </div>
  )
}

export function CheckoutForm({
  formId,
  defaultValues,
  wallet,
  otherWallet,
  usingOtherWallet,
  onToggleOtherWallet,
  disabled,
  onValuesChange,
  onSubmit,
}: CheckoutFormProps) {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const subscribe = form.subscribe

  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => onValuesChange(values),
    })
  }, [subscribe, onValuesChange])

  const errors = form.formState.errors

  return (
    <form
      id={formId}
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-labelledby="checkout-form-heading"
    >
      <h2 id="checkout-form-heading" className="text-base leading-4 font-bold">
        Perfil do colecionador
      </h2>

      <fieldset disabled={disabled} className="grid gap-x-5 gap-y-4 md:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-display-name" className={labelClass}>
            <span>
              Nome de exibição
              <RequiredMark />
            </span>
          </Label>
          <Input
            id="checkout-display-name"
            autoComplete="name"
            aria-required="true"
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? 'checkout-display-name-error' : undefined}
            className={fieldClass}
            {...form.register('displayName')}
          />
          <FieldError id="checkout-display-name-error" message={errors.displayName?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-username" className={labelClass}>
            <span>
              Nome de usuário
              <RequiredMark />
            </span>
          </Label>
          <Input
            id="checkout-username"
            autoComplete="username"
            aria-required="true"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? 'checkout-username-error' : undefined}
            className={fieldClass}
            {...form.register('username')}
          />
          <FieldError id="checkout-username-error" message={errors.username?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-network" className={labelClass}>
            <span>
              Rede
              <RequiredMark />
            </span>
          </Label>
          <ReadOnlySelect id="checkout-network" value={wallet?.network ?? ''} onChangePlaceholder="Selecione uma rede">
            {wallet && <option value={wallet.network}>{NETWORK_LABELS[wallet.network]}</option>}
          </ReadOnlySelect>
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-profile-name" className={labelClass}>
            <span>
              Nome do perfil
              <RequiredMark />
            </span>
          </Label>
          <Input
            id="checkout-profile-name"
            autoComplete="off"
            aria-required="true"
            aria-invalid={Boolean(errors.profileName)}
            aria-describedby={errors.profileName ? 'checkout-profile-name-error' : undefined}
            className={fieldClass}
            {...form.register('profileName')}
          />
          <FieldError id="checkout-profile-name-error" message={errors.profileName?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-address" className={labelClass}>
            <span>
              Endereço da carteira
              <RequiredMark />
            </span>
          </Label>
          <Input
            id="checkout-address"
            readOnly
            value={wallet?.address ?? ''}
            placeholder="Endereço 0x da carteira"
            className={`${fieldClass} text-[13px] md:text-[13px]`}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-secondary-address" className={labelClass}>
            ENS ou carteira secundária (opcional)
          </Label>
          <Input
            id="checkout-secondary-address"
            readOnly
            value={wallet?.secondaryAddress ?? ''}
            placeholder="ENS ou carteira secundária (opcional)"
            className={`${fieldClass} text-[13px] md:text-[13px]`}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-provider" className={labelClass}>
            <span>
              Tipo de carteira
              <RequiredMark />
            </span>
          </Label>
          <ReadOnlySelect id="checkout-provider" value={wallet?.provider ?? ''} onChangePlaceholder="Selecione uma carteira">
            {wallet && <option value={wallet.provider}>{WALLET_PROVIDER_LABELS[wallet.provider]}</option>}
          </ReadOnlySelect>
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-referral" className={labelClass}>
            <span>
              Código de indicação
              <RequiredMark />
            </span>
          </Label>
          <Input id="checkout-referral" readOnly value={wallet?.referralCode ?? ''} className={fieldClass} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-email" className={labelClass}>
            <span>
              E-mail
              <RequiredMark />
            </span>
          </Label>
          <Input
            id="checkout-email"
            type="email"
            autoComplete="email"
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'checkout-email-error' : undefined}
            className={fieldClass}
            {...form.register('email')}
          />
          <FieldError id="checkout-email-error" message={errors.email?.message} />
        </div>

        <div className="flex flex-col gap-2.5">
          <Label htmlFor="checkout-ens" className={labelClass}>
            <span>
              Nome ENS
              <RequiredMark />
            </span>
          </Label>
          <div className="flex">
            <Input
              id="checkout-ens"
              readOnly
              value={wallet?.ensName ?? ''}
              className={`${fieldClass} flex-1 rounded-r-none border-r-0`}
            />
            <div className="relative">
              <select
                id="checkout-ens-suffix"
                value=".eth"
                disabled
                aria-label="Sufixo do Nome ENS"
                className={cn(selectClass, 'h-11 w-[74px] rounded-l-none rounded-r-sm pl-3 md:h-10')}
              >
                <option value=".eth">.eth</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-3 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={usingOtherWallet}
            disabled={!otherWallet || disabled}
            onChange={() => onToggleOtherWallet()}
            className="peer sr-only"
          />
          <span className="grid size-4 shrink-0 place-items-center rounded-full border border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50 peer-disabled:opacity-50">
            {usingOtherWallet && <span className="size-2 rounded-full bg-primary" />}
          </span>
          Usar outra carteira?
        </label>

        <div className="flex flex-col gap-2.5 md:col-span-1">
          <Label htmlFor="checkout-note" className={labelClass}>
            Observação do colecionador (opcional)
          </Label>
          <Textarea
            id="checkout-note"
            maxLength={500}
            aria-describedby={errors.note ? 'checkout-note-hint checkout-note-error' : 'checkout-note-hint'}
            aria-invalid={Boolean(errors.note)}
            className="min-h-[150px] resize-y rounded-sm"
            {...form.register('note')}
          />
          <p id="checkout-note-hint" className="sr-only">
            Máximo de 500 caracteres.
          </p>
          <FieldError id="checkout-note-error" message={errors.note?.message} />
        </div>
      </fieldset>
    </form>
  )
}
