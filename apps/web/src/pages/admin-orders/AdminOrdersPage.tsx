import { useAdminLogout, useAdminOrders, type AdminOrdersSearch } from '@/domains/admin'
import { AdminSideMenu } from '@/shared/ui/admin-side-menu'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'
import { OrdersFilter } from './components/OrdersFilter'
import { OrdersPager } from './components/OrdersPager'
import { OrdersTable } from './components/OrdersTable'

/** Orders of every user, newest first, read-only. The filter and the page live in the URL (`search`). */
export function AdminOrdersPage({
  search,
  onSearchChange,
}: {
  search: AdminOrdersSearch
  onSearchChange: (search: AdminOrdersSearch) => void
}) {
  const logout = useAdminLogout()
  const orders = useAdminOrders(search)
  const page = search.page ?? 1

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AdminSideMenu active="orders" onLogout={logout} />
      <section aria-labelledby="admin-orders-title" className="flex min-w-0 flex-col gap-6">
        <div>
          <h1 id="admin-orders-title" className="text-title font-bold">
            Pedidos
          </h1>
          <p className="text-muted-foreground">Pedidos de todos os usuários, do mais recente para o mais antigo.</p>
        </div>

        <OrdersFilter status={search.status} onChange={(status) => onSearchChange({ status, page: undefined })} />

        {orders.isError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">
            <span>Não foi possível carregar os pedidos.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void orders.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {orders.isPending && <Skeleton aria-busy="true" aria-label="Carregando pedidos" className="h-64 w-full" />}

        {orders.data && (
          <div className="flex flex-col gap-4" aria-live="polite">
            {orders.data.items.length === 0 ? (
              <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
            ) : (
              <OrdersTable orders={orders.data.items} />
            )}
            <OrdersPager
              page={orders.data.page}
              totalPages={orders.data.totalPages}
              total={orders.data.total}
              onPrevious={() => onSearchChange({ ...search, page: page - 1 <= 1 ? undefined : page - 1 })}
              onNext={() => onSearchChange({ ...search, page: page + 1 })}
            />
          </div>
        )}
      </section>
    </PageContainer>
  )
}
