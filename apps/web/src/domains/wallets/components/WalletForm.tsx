import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Path } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { createWallet, updateWallet, WALLETS_QUERY_KEY } from '../api/queries'
import { NETWORK_LABELS, NETWORKS, PROVIDER_LABELS, WALLET_PROVIDERS, type Wallet, type WalletSlot } from '../model/contracts'

const schema = z.object({
  label: z.string().trim().min(2, 'Use de 2 a 40 caracteres.').max(40, 'Use de 2 a 40 caracteres.'),
  provider: z.enum(WALLET_PROVIDERS, { error: 'Escolha um provedor válido.' }),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Informe um endereço 0x com 40 caracteres hexadecimais.'),
  networks: z.array(z.enum(NETWORKS)).min(1, 'Selecione ao menos uma rede.'),
})
type FormValues = z.infer<typeof schema>

export function WalletForm({
  slot,
  wallet,
  defaultValues,
  onSaved,
}: {
  slot: WalletSlot
  /** An existing saved wallet to edit — its presence (and id) is what makes this an update, not a create. */
  wallet?: Wallet
  /** Prefill values for a brand-new wallet (e.g. "Igual à carteira principal"), without editing anything. */
  defaultValues?: Pick<FormValues, 'label' | 'provider' | 'address' | 'networks'>
  onSaved?: (wallet: Wallet) => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: wallet
      ? { label: wallet.label, provider: wallet.provider, address: wallet.address, networks: wallet.networks }
      : (defaultValues ?? { label: '', address: '', networks: [] }),
  })
  const networks = watch('networks')

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      wallet ? updateWallet({ walletId: wallet.id, slot, ...values }) : createWallet({ slot, ...values }),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: WALLETS_QUERY_KEY })
      toast.success('Carteira salva.')
      onSaved?.(saved)
    },
    onError: (error) => {
      if (isApiError(error)) {
        const known = Object.entries(error.fields).filter(([name]) => name in schema.shape)
        known.forEach(([name, message]) => setError(name as Path<FormValues>, { type: 'server', message }))
        toast.error(known.length > 0 ? 'Corrija os campos destacados.' : error.message)
      } else {
        toast.error('Não foi possível salvar a carteira.')
      }
    },
  })

  function toggleNetwork(network: (typeof NETWORKS)[number], checked: boolean) {
    setValue('networks', checked ? [...networks, network] : networks.filter((n) => n !== network), { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate className="flex flex-col gap-4">
      <Field label="Apelido da carteira" required error={errors.label?.message}>
        <Input {...register('label')} />
      </Field>

      <Field label="Tipo de carteira" required error={errors.provider?.message}>
        <Select {...register('provider')}>
          <option value="">Selecione uma carteira</option>
          {WALLET_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {PROVIDER_LABELS[provider]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Endereço da carteira" required error={errors.address?.message}>
        <Input placeholder="Endereço 0x da carteira" {...register('address')} />
      </Field>

      <fieldset>
        <Label className="mb-2 block" required>
          Rede
        </Label>
        <div className="flex flex-wrap gap-4">
          {NETWORKS.map((network) => (
            <label key={network} htmlFor={`network-${slot}-${network}`} className="flex cursor-pointer items-center gap-2 text-body">
              <Checkbox
                id={`network-${slot}-${network}`}
                checked={networks.includes(network)}
                onCheckedChange={(checked) => toggleNetwork(network, checked === true)}
              />
              {NETWORK_LABELS[network]}
            </label>
          ))}
        </div>
        {errors.networks && (
          <p role="alert" className="mt-2 text-caption text-destructive">
            {errors.networks.message}
          </p>
        )}
      </fieldset>

      <Button type="submit" className="w-fit" disabled={save.isPending}>
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
