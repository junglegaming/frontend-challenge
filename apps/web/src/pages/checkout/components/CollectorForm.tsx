import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { NETWORK_LABELS, NETWORKS } from '@/domains/wallets'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

export const collectorSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe o nome completo.').max(60, 'Use no máximo 60 caracteres.'),
  email: z.email('Informe um e-mail válido.'),
  network: z.enum(NETWORKS, { error: 'Selecione uma rede.' }),
  note: z.string().max(280, 'Use no máximo 280 caracteres.').optional(),
})
export type CollectorFormValues = z.infer<typeof collectorSchema>

export function useCollectorForm(defaultValues?: Partial<CollectorFormValues>) {
  return useForm<CollectorFormValues>({
    resolver: zodResolver(collectorSchema),
    defaultValues: { fullName: '', email: '', note: '', ...defaultValues },
  })
}

export function CollectorForm({ form }: { form: ReturnType<typeof useCollectorForm> }) {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-title font-bold">Perfil do colecionador</h2>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Field label="Nome de exibição" required error={errors.fullName?.message}>
          <Input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="E-mail" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Rede" required error={errors.network?.message}>
          <Select {...register('network')}>
            <option value="">Selecione uma rede</option>
            {NETWORKS.map((network) => (
              <option key={network} value={network}>
                {NETWORK_LABELS[network]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="collector-note">Observação do colecionador (opcional)</Label>
        <Textarea id="collector-note" rows={4} {...register('note')} />
      </div>
    </div>
  )
}
