import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { useCreateWallet, useUpdateWallet } from '@/features/account/api'
import {
  ENS_DOMAINS,
  WALLET_PROVIDER_LABELS,
  ensDomainSchema,
} from '@/features/checkout/checkout-form'
import { ApiError } from '@/shared/api/http-client'
import { type Profile, type Wallet, networkSchema, walletProviderSchema } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { type WalletFormValues, walletFormDefaults, walletFormSchema } from '../wallet-form'

const labelClass = 'flex items-center font-mono text-[15px] leading-[15px] text-foreground'
const requiredMark = (
  <span className="ml-0.5 font-mono text-[22px] leading-[15px] text-coral">*</span>
)
const columnClass = 'flex w-full flex-col gap-1 sm:w-[417px]'
const rowClass = 'flex w-full flex-col justify-between gap-4 sm:flex-row sm:gap-[28px]'

/** Campos da API que têm correspondente no formulário (erros por campo). */
const API_FIELD_TO_FORM: Partial<Record<string, keyof WalletFormValues>> = {
  label: 'label',
  network: 'network',
  address: 'address',
  provider: 'provider',
  referralCode: 'referralCode',
  ensName: 'ensName',
}

/** Props de {@link WalletForm}. */
interface WalletFormProps {
  /** Carteira em edição; `null` cadastra uma nova. */
  wallet: Wallet | null
  /** No cadastro: a nova carteira passa a ser a principal. */
  makePrimary: boolean
  /** Dados do colecionador exibidos (somente leitura) no formulário. */
  profile: Profile | undefined
}

/**
 * Cadastro e edição de carteira (Figma "Carteiras"). Validação local com zod e
 * erros da API (ex.: endereço duplicado) exibidos no campo correspondente.
 *
 * @param props - {@link WalletFormProps}
 * @returns Formulário da carteira.
 */
export function WalletForm({ wallet, makePrimary, profile }: WalletFormProps) {
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: walletFormDefaults(wallet),
  })
  const { errors } = form.formState
  const isSaving = createWallet.isPending || updateWallet.isPending
  const apiError = createWallet.error ?? updateWallet.error
  const apiMessage =
    apiError instanceof ApiError && !apiError.fields
      ? apiError.message
      : apiError && !(apiError instanceof ApiError)
        ? 'Não foi possível salvar a carteira. Tente novamente.'
        : null

  function a11y(name: keyof WalletFormValues) {
    return {
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? `wallet-${name}-error` : undefined,
    }
  }

  function renderError(name: keyof WalletFormValues) {
    const message = errors[name]?.message
    return message ? (
      <p id={`wallet-${name}-error`} className="mt-1 font-mono text-[12px] leading-4 text-coral">
        {message}
      </p>
    ) : null
  }

  function applyApiFieldErrors(error: Error) {
    if (!(error instanceof ApiError) || !error.fields) return
    for (const [field, message] of Object.entries(error.fields)) {
      const formField = API_FIELD_TO_FORM[field]
      if (formField) form.setError(formField, { message })
    }
  }

  function onSubmit(values: WalletFormValues) {
    setSavedMessage(null)
    const body = {
      label: values.label,
      network: values.network,
      address: values.address,
      provider: values.provider,
      referralCode: values.referralCode.toUpperCase(),
      ensName: `${values.ensName}${values.ensDomain}`,
    }
    const callbacks = {
      onSuccess: () => setSavedMessage('Carteira salva. Ela já pode ser usada no pagamento.'),
      onError: applyApiFieldErrors,
    }
    if (wallet) updateWallet.mutate({ id: wallet.id, ...body }, callbacks)
    else createWallet.mutate({ ...body, isPrimary: makePrimary }, callbacks)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex w-full flex-col gap-6">
      <div className={rowClass}>
        <div className={columnClass}>
          <label htmlFor="displayName" className={labelClass}>
            <span>Nome de exibição</span>
            {requiredMark}
          </label>
          <Input
            id="displayName"
            value={profile?.name ?? ''}
            readOnly
            aria-describedby="profile-fields-hint"
          />
        </div>
        <div className={columnClass}>
          <label htmlFor="walletAlias" className={labelClass}>
            <span>Apelido da carteira</span>
            {requiredMark}
          </label>
          <Input id="walletAlias" {...form.register('label')} {...a11y('label')} />
          {renderError('label')}
        </div>
      </div>

      <div className={rowClass}>
        <div className={columnClass}>
          <label htmlFor="walletNetwork" className={labelClass}>
            <span>Rede</span>
            {requiredMark}
          </label>
          <Controller
            control={form.control}
            name="network"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(networkSchema.parse(value))}
              >
                <SelectTrigger id="walletNetwork" {...a11y('network')}>
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  {networkSchema.options.map((network) => (
                    <SelectItem key={network} value={network}>
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {renderError('network')}
        </div>
        <div className={columnClass}>
          <label htmlFor="profileName" className={labelClass}>
            <span>Nome do perfil</span>
            {requiredMark}
          </label>
          <Input
            id="profileName"
            value={profile?.name ?? ''}
            readOnly
            aria-describedby="profile-fields-hint"
          />
        </div>
      </div>

      <div className={`${rowClass} sm:items-end`}>
        <div className={columnClass}>
          <label htmlFor="walletAddress" className={labelClass}>
            <span>Endereço da carteira</span>
            {requiredMark}
          </label>
          <Input
            id="walletAddress"
            placeholder="Endereço 0x da carteira"
            {...form.register('address')}
            {...a11y('address')}
          />
          {renderError('address')}
        </div>
        <div className={columnClass}>
          <label htmlFor="secondaryAddress" className="sr-only">
            ENS ou carteira secundária (opcional)
          </label>
          <Input
            id="secondaryAddress"
            placeholder="ENS ou carteira secundária (opcional)"
            {...form.register('secondaryAddress')}
            {...a11y('secondaryAddress')}
          />
          {renderError('secondaryAddress')}
        </div>
      </div>

      <div className={rowClass}>
        <div className={columnClass}>
          <label htmlFor="walletProvider" className={labelClass}>
            <span>Tipo de carteira</span>
            {requiredMark}
          </label>
          <Controller
            control={form.control}
            name="provider"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(walletProviderSchema.parse(value))}
              >
                <SelectTrigger id="walletProvider" {...a11y('provider')}>
                  <SelectValue placeholder="Selecione uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {walletProviderSchema.options.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {WALLET_PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className={columnClass}>
          <label htmlFor="referralCode" className={labelClass}>
            <span>Código de indicação</span>
            {requiredMark}
          </label>
          <Input id="referralCode" {...form.register('referralCode')} {...a11y('referralCode')} />
          {renderError('referralCode')}
        </div>
      </div>

      <div className={rowClass}>
        <div className={columnClass}>
          <label htmlFor="email" className={labelClass}>
            <span>E-mail</span>
            {requiredMark}
          </label>
          <Input
            id="email"
            type="email"
            value={profile?.email ?? ''}
            readOnly
            aria-describedby="profile-fields-hint"
          />
        </div>
        <div className={columnClass}>
          <label htmlFor="ensName" className={labelClass}>
            <span>Nome ENS</span>
            {requiredMark}
          </label>
          <div className="flex w-full items-center gap-[10px]">
            <Controller
              control={form.control}
              name="ensDomain"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(ensDomainSchema.parse(value))}
                >
                  <SelectTrigger
                    aria-label="Domínio ENS"
                    className="w-[78px] shrink-0 px-2.5 text-[15px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENS_DOMAINS.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Input id="ensName" {...form.register('ensName')} {...a11y('ensName')} />
          </div>
          {renderError('ensName')}
        </div>
      </div>

      <p id="profile-fields-hint" className="font-mono text-[12px] leading-4 text-text-secondary">
        Nome, nome do perfil e e-mail vêm de Dados do perfil.
      </p>

      {apiMessage && (
        <p role="alert" className="font-mono text-sm text-coral">
          {apiMessage}
        </p>
      )}
      {savedMessage && (
        <p role="status" className="font-mono text-sm text-success">
          {savedMessage}
        </p>
      )}

      <Button type="submit" size="sm" className="w-[131px] rounded-[3px]" disabled={isSaving}>
        {isSaving ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
