import { useQuery } from '@tanstack/react-query'
import { cartQueries } from '@/domains/cart'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'
import { CartLineList } from './components/CartLineList'
import { CartLoadError } from './components/CartLoadError'
import { CartSummary } from './components/CartSummary'
import { EmptyCart } from './components/EmptyCart'
import { RelatedNfts } from './components/RelatedNfts'

export function CartPage() {
  const cart = useQuery(cartQueries.view())

  if (cart.isError) return <CartLoadError onRetry={() => void cart.refetch()} />

  return (
    <PageContainer className="flex flex-col gap-10 py-8">
      <h1 className="text-title font-bold">Carrinho</h1>

      {cart.isPending && <Skeleton className="h-96 w-full" />}

      {cart.data && cart.data.items.length === 0 && <EmptyCart />}

      {cart.data && cart.data.items.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <CartLineList items={cart.data.items} />
          <CartSummary />
        </div>
      )}

      <RelatedNfts />
    </PageContainer>
  )
}
