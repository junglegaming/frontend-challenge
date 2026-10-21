import { Link } from '@tanstack/react-router'
import { PageContainer } from '@/shared/ui/page-container'
import { Separator } from '@/shared/ui/separator'

interface FooterColumn {
  title: string
  links: string[]
}

const CURRENT_YEAR = new Date().getFullYear()

const COLUMNS: FooterColumn[] = [
  { title: 'Minha conta', links: ['Perfil', 'Carteiras', 'Favoritos', 'Pedidos'] },
  { title: 'Central de ajuda', links: ['Como comprar NFTs', 'Carteira e segurança', 'Política do mercado'] },
  { title: 'Coleções', links: ['Arte digital', 'Fotografia', 'Música', 'Mundos virtuais'] },
]

/**
 * Site footer, reused by every page via the root route layout. Purely presentational:
 * every secondary link is non-interactive (`<span>`) because those pages are out of scope —
 * they must not look clickable/functional, per the challenge's eliminatory criteria.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <PageContainer className="py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="text-title font-bold tracking-widest">
              KURIO
            </Link>
            <p className="mt-2 max-w-xs text-body text-muted-foreground">
              Descubra, colecione e venda NFTs exclusivos de artistas independentes.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={`Rodapé: ${column.title}`}>
              <h2 className="text-body font-bold text-foreground">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    {/* Out of scope for this delivery: rendered as plain text, not a link. */}
                    <span className="text-body text-muted-foreground">{link}</span>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted-foreground">
            © {CURRENT_YEAR} Kurio. Projeto de desafio técnico — dados e integrações simulados.
          </p>
          <p className="text-caption text-muted-foreground">Carteiras compatíveis (simuladas): MetaMask · Coinbase · WalletConnect</p>
        </div>
      </PageContainer>
    </footer>
  )
}
