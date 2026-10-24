import { Link } from '@tanstack/react-router'
import { useAdminLogout, useAdminOverview } from '@/domains/admin'
import { AdminSideMenu } from '@/shared/ui/admin-side-menu'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-border p-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-title font-bold text-primary">{value}</dd>
    </div>
  )
}

const shortcutClass = 'rounded-sm border border-border p-4 text-primary underline hover:bg-card'

/** Admin home: the marketplace totals (computed when the screen opens) and shortcuts to each area. */
export function AdminDashboardPage() {
  const logout = useAdminLogout()
  const overview = useAdminOverview()

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AdminSideMenu active="overview" onLogout={logout} />
      <section aria-labelledby="admin-dashboard-title" className="flex min-w-0 flex-col gap-6">
        <div>
          <h1 id="admin-dashboard-title" className="text-title font-bold">
            Visão geral
          </h1>
          <p className="text-muted-foreground">Totais do marketplace, calculados ao abrir esta tela.</p>
        </div>

        {overview.isError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">
            <span>Não foi possível carregar o painel.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void overview.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {overview.isPending && <Skeleton aria-busy="true" aria-label="Carregando painel" className="h-64 w-full" />}

        {overview.data && (
          <div className="flex flex-col gap-6" aria-live="polite">
            <section aria-labelledby="overview-products" className="flex flex-col gap-3">
              <h2 id="overview-products" className="font-bold">
                Catálogo
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Metric label="Produtos publicados" value={overview.data.products.total} />
              </dl>
            </section>

            <section aria-labelledby="overview-users" className="flex flex-col gap-3">
              <h2 id="overview-users" className="font-bold">
                Contas
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Metric label="Usuários" value={overview.data.users.total} />
                <Metric label="Usuários suspensos" value={overview.data.users.suspended} />
              </dl>
            </section>

            <section aria-labelledby="overview-orders" className="flex flex-col gap-3">
              <h2 id="overview-orders" className="font-bold">
                Pedidos
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Pedidos" value={overview.data.orders.total} />
                <Metric label="Pedidos pendentes" value={overview.data.orders.pending} />
                <Metric label="Pedidos confirmados" value={overview.data.orders.confirmed} />
                <Metric label="Pedidos recusados" value={overview.data.orders.declined} />
              </dl>
            </section>
          </div>
        )}

        <nav aria-label="Atalhos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/admin/products" className={shortcutClass}>
            Produtos
          </Link>
          <Link to="/admin/users" className={shortcutClass}>
            Usuários
          </Link>
          <Link to="/admin/orders" className={shortcutClass}>
            Pedidos
          </Link>
          <Link to="/admin/coins" className={shortcutClass}>
            Moedas
          </Link>
        </nav>
      </section>
    </PageContainer>
  )
}
