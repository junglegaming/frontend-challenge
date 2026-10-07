import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { useCatalogRealtimeSync } from '@/domains/catalog'
import { Footer } from '../layout/Footer'
import { Header } from '../layout/Header'
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  )
}

function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe ou foi removido.</p>
      <Link to="/" className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground">
        Voltar ao início
      </Link>
    </section>
  )
}
