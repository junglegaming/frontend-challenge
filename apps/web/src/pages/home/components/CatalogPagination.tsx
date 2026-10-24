import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const navigate = useNavigate({ from: '/' })
  if (totalPages <= 1) return null

  function goTo(next: number) {
    void navigate({ search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }) })
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav aria-label="Paginação do catálogo" className="flex items-center justify-center gap-2">
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? 'default' : 'outline'}
          size="icon"
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Página ${p}`}
          onClick={() => goTo(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
      >
        {'>'}
      </Button>
    </nav>
  )
}
