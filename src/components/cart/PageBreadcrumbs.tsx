import { Link } from '@tanstack/react-router'

interface PageBreadcrumbsProps {
  current: string
}

export function PageBreadcrumbs({ current }: PageBreadcrumbsProps) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-3 text-sm leading-4 font-medium">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="transition-colors hover:text-accent-text">
            Início
          </Link>
        </li>
        <li aria-hidden="true" className="text-subtle">
          /
        </li>
        <li>
          <Link to="/" hash="catalogo" className="transition-colors hover:text-accent-text">
            Mercado
          </Link>
        </li>
        <li aria-hidden="true" className="text-subtle">
          /
        </li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  )
}
