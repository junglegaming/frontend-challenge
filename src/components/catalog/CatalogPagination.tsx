import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CatalogPaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function CatalogPagination({ page, totalPages, onChange }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className="mt-10 flex items-center justify-end gap-2 md:mt-[88px]">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => {
        const active = number === page
        return (
          <button
            key={number}
            type="button"
            onClick={() => onChange(number)}
            aria-label={`Página ${number}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'grid size-[35px] place-items-center text-sm transition-colors',
              active ? 'bg-primary font-bold text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {number}
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
        className="grid size-[35px] place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
