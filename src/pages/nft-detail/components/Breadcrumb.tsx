import { Link } from '@tanstack/react-router'
import { CATEGORY_LABELS, type NftCategory } from '@/domains/catalog'

export function Breadcrumb({ category, name }: { category: NftCategory; name: string }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-foreground hover:underline">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link to="/" search={{ category: [category] }} className="hover:text-foreground hover:underline">
            {CATEGORY_LABELS[category]}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-foreground">
          {name}
        </li>
      </ol>
    </nav>
  )
}
