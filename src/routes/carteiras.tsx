import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { profileQueryOptions, useUpdateWallet, walletsQueryOptions } from '@/features/account/api'
import { AccountSidebar } from '@/features/account/components/AccountSidebar'
import { WalletForm } from '@/features/account/components/WalletForm'
import { shortAddress, walletDisplayName } from '@/features/checkout/format'
import { getToken } from '@/shared/session'
import { Button } from '@/shared/ui/button'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: ({ location }) => {
    if (!getToken()) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: CarteirasPage,
})

/** O que o formulário está editando: a principal, a secundária ou uma nova. */
type EditTarget = { kind: 'primary' | 'secondary'; isNew: boolean }

function CarteirasPage() {
  const walletsQuery = useQuery(walletsQueryOptions())
  const profileQuery = useQuery(profileQueryOptions())
  const updateWallet = useUpdateWallet()
  const [target, setTarget] = useState<EditTarget>({ kind: 'primary', isNew: false })

  const wallets = walletsQuery.data ?? []
  const primary = wallets.find((w) => w.isPrimary) ?? null
  const secondary = wallets.find((w) => !w.isPrimary) ?? null
  const formWallet = target.isNew ? null : target.kind === 'primary' ? primary : secondary
  // Sem nenhuma carteira, o primeiro cadastro é sempre o da principal.
  const makePrimary = target.kind === 'primary' || !primary

  const editingDescription = target.isNew
    ? target.kind === 'primary'
      ? 'Nova carteira principal: a atual passa a ser secundária.'
      : 'Nova carteira secundária.'
    : formWallet
      ? `Editando ${walletDisplayName(formWallet)} (${shortAddress(formWallet.address)}).`
      : 'Cadastre sua primeira carteira.'

  return (
    <div className="mx-auto flex w-full max-w-[1248px] flex-col px-4 py-8 pb-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-[28px] lg:flex-row">
        <AccountSidebar />

        <section
          aria-label="Carteiras do colecionador"
          className="flex w-full flex-col gap-8 lg:min-w-0 lg:flex-1"
        >
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-start justify-between">
              <h1 className="font-mono text-[17px] leading-[16px] font-bold text-foreground">
                Carteira principal
              </h1>
              <button
                type="button"
                aria-label="Adicionar nova carteira principal"
                onClick={() => setTarget({ kind: 'primary', isNew: true })}
                className="cursor-pointer font-mono text-[16px] leading-[16px] font-medium text-highlight transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Adicionar
              </button>
            </div>
            <p className="font-mono text-[14px] leading-[15px] font-normal text-text-secondary">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
            <p aria-live="polite" className="font-mono text-[13px] leading-4 text-highlight">
              {walletsQuery.isLoading ? 'Carregando carteiras…' : editingDescription}
            </p>
          </div>

          {walletsQuery.isError && (
            <p role="alert" className="font-mono text-sm text-coral">
              Não foi possível carregar suas carteiras.
            </p>
          )}

          {!walletsQuery.isLoading && (
            <WalletForm
              key={`${target.kind}-${target.isNew}-${formWallet?.id ?? 'nova'}`}
              wallet={formWallet}
              makePrimary={makePrimary}
              profile={profileQuery.data}
            />
          )}

          <div className="flex w-full flex-col gap-3 pt-2">
            <div className="flex w-full items-start justify-between gap-4">
              <h2 className="font-mono text-[17px] leading-[16px] font-bold text-foreground">
                Carteira secundária
              </h2>
              <div className="flex items-center gap-4">
                {/* Sem secundária, a principal é usada para tudo (estado informativo). */}
                <span
                  role="radio"
                  aria-checked={!secondary}
                  aria-disabled="true"
                  className="flex items-center gap-2"
                >
                  <span className="flex size-4 items-center justify-center rounded-full border-[1.5px] border-primary">
                    {!secondary && <span className="size-1.5 rounded-full bg-primary" />}
                  </span>
                  <span className="font-mono text-[14px] leading-[16px] text-foreground">
                    Igual à carteira principal
                  </span>
                </span>
                {!secondary && primary && (
                  <button
                    type="button"
                    aria-label="Adicionar carteira secundária"
                    onClick={() => setTarget({ kind: 'secondary', isNew: true })}
                    className="cursor-pointer font-mono text-[16px] leading-[16px] font-medium text-highlight transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Adicionar
                  </button>
                )}
              </div>
            </div>

            {secondary ? (
              <div className="flex flex-col gap-3 rounded-[6px] border border-field p-4 font-mono sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1 text-[14px] leading-5">
                  <span className="font-bold text-foreground">{walletDisplayName(secondary)}</span>
                  <span className="text-text-secondary">
                    {shortAddress(secondary.address)} · Rede {secondary.network}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setTarget({ kind: 'secondary', isNew: false })}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={updateWallet.isPending}
                    onClick={() => {
                      updateWallet.mutate({ id: secondary.id, isPrimary: true })
                      setTarget({ kind: 'primary', isNew: false })
                    }}
                  >
                    Tornar principal
                  </Button>
                </div>
              </div>
            ) : (
              <p className="font-mono text-[14px] leading-[15px] font-normal text-text-secondary">
                Você ainda não adicionou uma carteira secundária.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
