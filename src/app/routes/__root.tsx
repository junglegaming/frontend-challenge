import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { useSession } from '@/domains/auth'
import { useCartCount } from '@/domains/cart'
import { useCatalogRealtimeSync } from '@/domains/catalog'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'
import { Dock, DOCK_HEIGHT_CLASS } from '../layout/Dock'
import { Footer } from '../layout/Footer'
import { Navbar } from '../layout/Navbar'
import type { RouterContext } from '../router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  // Global so catalog data stays live everywhere it's cached (detail, search, featured).
  useCatalogRealtimeSync()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <div className={`flex min-h-dvh flex-col ${DOCK_HEIGHT_CLASS}`}>
        <NavbarContainer />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Dock />
    </>
  )
}

/** Feeds the presentational Navbar from the cart and session. */
function NavbarContainer() {
  const cartCount = useCartCount()
  const session = useSession()
  const user = session.data ? { name: session.data.user.name, avatarUrl: session.data.user.avatarUrl } : null
  return <Navbar cartCount={cartCount} user={user} />
}

function NotFound() {
  return (
    <PageContainer className="flex max-w-xl flex-col items-center gap-6 py-24 text-center">
      <h1 className="text-title font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe ou foi removido.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </PageContainer>
  )
}
