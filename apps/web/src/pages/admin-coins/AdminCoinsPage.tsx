import { useAdminLogout } from '@/domains/admin'
import { SessionBar, useCoinsAdminSessionRedirect } from '@/domains/coins-admin'
import { AdminSideMenu } from '@/shared/ui/admin-side-menu'
import { PageContainer } from '@/shared/ui/page-container'
import { OwnersPanel } from './components/OwnersPanel'

export function AdminCoinsPage({
  cursors,
  onCursorsChange,
}: {
  cursors: string[]
  onCursorsChange: (cursors: string[]) => void
}) {
  useCoinsAdminSessionRedirect()
  const logout = useAdminLogout()

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AdminSideMenu active="coins" onLogout={logout} />
      <section aria-labelledby="admin-coins-title" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="admin-coins-title" className="text-title font-bold">
              Moedas
            </h1>
            <p className="text-muted-foreground">Consulta somente leitura dos saldos e extratos das moedas.</p>
          </div>
          <SessionBar />
        </div>

        <OwnersPanel cursors={cursors} onCursorsChange={onCursorsChange} />
      </section>
    </PageContainer>
  )
}
