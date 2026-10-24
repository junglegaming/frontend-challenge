import { Link } from '@tanstack/react-router'
import { useAdminLogout } from '@/domains/admin'
import {
  OWNER_TRANSACTIONS_SHOWN,
  SessionBar,
  coinsAdminErrorMessage,
  ownerIdSchema,
  useCoinsAdminSessionRedirect,
  useOwnerDetail,
} from '@/domains/coins-admin'
import { AdminSideMenu } from '@/shared/ui/admin-side-menu'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function BackToList() {
  return (
    <Link to="/admin/coins" className="text-primary underline">
      Voltar para a lista
    </Link>
  )
}

/** Balance and the most recent operations of one owner, read-only. */
export function AdminCoinsOwnerPage({ ownerId }: { ownerId: string }) {
  useCoinsAdminSessionRedirect()
  const logout = useAdminLogout()
  const validId = ownerIdSchema.safeParse(ownerId).success
  const detail = useOwnerDetail(ownerId)

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AdminSideMenu active="coins" onLogout={logout} />
      <section aria-labelledby="admin-coins-owner-title" className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 id="admin-coins-owner-title" className="break-all text-title font-bold">
              {validId ? `Dono ${ownerId}` : 'Dono inválido'}
            </h1>
            <BackToList />
          </div>
          <SessionBar />
        </div>

        {!validId && <p role="alert">Identificador de dono inválido.</p>}

        {validId && detail.isError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">
            <span>{coinsAdminErrorMessage(detail.error)}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void detail.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {validId && !detail.isError && !detail.data && (
          <Skeleton aria-busy="true" aria-label="Carregando dono" className="h-64 w-full" />
        )}

        {validId && detail.data && (
          <>
            <p aria-live="polite" className="text-title font-bold text-primary">
              {detail.data.balance.amount} moedas
            </p>

            {detail.data.transactions.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma operação.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-body">
                    <caption className="sr-only">Extrato de operações do dono {ownerId}</caption>
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className="py-2 pr-4 font-bold">
                          Tipo
                        </th>
                        <th scope="col" className="py-2 pr-4 font-bold">
                          Valor
                        </th>
                        <th scope="col" className="py-2 pr-4 font-bold">
                          Saldo resultante
                        </th>
                        <th scope="col" className="py-2 font-bold">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.data.transactions.map((tx) => (
                        <tr key={tx.txId} className="border-b border-border">
                          <td className="py-2 pr-4">{tx.direction === 'credit' ? 'Crédito' : 'Débito'}</td>
                          <td className="py-2 pr-4">{tx.amount}</td>
                          <td className="py-2 pr-4">{tx.resultingBalance}</td>
                          <td className="py-2 text-muted-foreground">{dateFormat.format(new Date(tx.createdAt))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {detail.data.transactions.length >= OWNER_TRANSACTIONS_SHOWN && (
                  <p className="text-muted-foreground">
                    Mostrando as {OWNER_TRANSACTIONS_SHOWN} operações mais recentes.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </PageContainer>
  )
}
