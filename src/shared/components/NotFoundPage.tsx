import { Link } from '@tanstack/react-router'

import { DEFAULT_NFT_LIST_QUERY } from '@/shared/contracts'

/**
 * Página de rota inexistente, no mesmo padrão visual do "NFT não encontrado".
 *
 * @returns Conteúdo da página 404.
 */
export function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-16 text-center sm:px-6 xl:px-0">
      <p className="font-mono text-sm font-bold tracking-[0.1em] text-highlight">Erro 404</p>
      <h1 className="mt-2 font-mono text-2xl font-bold text-foreground">Página não encontrada</h1>
      <p className="mt-2 font-mono text-sm text-text-secondary">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Link
        to="/"
        search={DEFAULT_NFT_LIST_QUERY}
        className="mt-6 inline-flex rounded-[6px] bg-primary px-4 py-2 font-mono text-sm font-bold text-ink transition-colors hover:bg-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Voltar ao catálogo
      </Link>
    </div>
  )
}
