import { useAdminLogout } from '@/domains/admin'
import { AdminSideMenu } from '@/shared/ui/admin-side-menu'
import { PageContainer } from '@/shared/ui/page-container'
import { ListingForm } from './components/ListingForm'
import { ListingTable } from './components/ListingTable'

export function AdminProductsPage() {
  const logout = useAdminLogout()

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AdminSideMenu active="products" onLogout={logout} />
      <section aria-labelledby="admin-products-title" className="flex flex-col gap-6">
        <div>
          <h1 id="admin-products-title" className="text-title font-bold">
            Produtos
          </h1>
          <p className="text-muted-foreground">Crie e gerencie os anúncios de NFT da vitrine.</p>
        </div>

        <ListingForm />
        <ListingTable />
      </section>
    </PageContainer>
  )
}
