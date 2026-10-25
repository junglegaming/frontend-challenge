import { createFileRoute, Link } from '@tanstack/react-router'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import { CartLine } from '@/components/cart/CartLine'
import { CartSkeleton } from '@/components/cart/CartSkeleton'
import { CartSummary } from '@/components/cart/CartSummary'
import { MobileBackLink } from '@/components/cart/MobileBackLink'
import { PageBreadcrumbs } from '@/components/cart/PageBreadcrumbs'
import { RelatedNfts } from '@/components/cart/RelatedNfts'
import { useCart } from '@/hooks/useCart'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const cart = useCart()

  return (
    <PageContainer className="px-7 py-8">
      <div className="hidden md:block">
        <PageBreadcrumbs current="Carrinho" />
      </div>

      <header className="mb-3 flex h-11 items-center justify-between gap-3 md:hidden">
        <MobileBackLink to="/" label="Voltar ao início" />
        <h1 className="flex-1 text-center text-xl font-bold">Carrinho de NFTs</h1>
        <span className="size-9 shrink-0" aria-hidden="true" />
      </header>
      <h1 className="sr-only hidden md:block">Carrinho de NFTs</h1>

      <div aria-busy={cart.isFetching}>
        {cart.isPending && <CartSkeleton />}

        {cart.isError && (
          <ErrorState
            error={cart.error}
            title="Não foi possível carregar o carrinho"
            onRetry={() => void cart.refetch()}
            isRetrying={cart.isFetching}
          />
        )}

        {cart.isSuccess && cart.data.items.length === 0 && (
          <EmptyState
            title="Seu carrinho está vazio"
            description="Explore o catálogo e encontre sua próxima obra digital."
            action={
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Explorar NFTs
                </Link>
              </Button>
            }
          />
        )}

        {cart.isSuccess && cart.data.items.length > 0 && (
          <div className="grid gap-8 pb-[370px] xl:grid-cols-[minmax(0,1fr)_332px] xl:gap-x-[86px] md:pb-0">
            <section aria-labelledby="cart-items-heading">
              <h2 id="cart-items-heading" className="sr-only">
                Itens do carrinho
              </h2>
              <div className="hidden grid-cols-[minmax(0,1fr)_138px_136px_148px_48px] border-b border-border pb-3 text-sm leading-4 font-bold md:grid">
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span className="sr-only">Ações</span>
              </div>
              <ul className="mt-0 flex flex-col gap-5 md:mt-3 md:gap-3">
                {cart.data.items.map((item) => (
                  <CartLine key={item.id} item={item} />
                ))}
              </ul>
            </section>

            <CartSummary cart={cart.data} />
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <RelatedNfts />
      </div>
    </PageContainer>
  )
}
