import { Button } from '@/shared/ui/button'

/** Previous/next through the pages of the list (the page number lives in the URL). */
export function OrdersPager({
  page,
  totalPages,
  total,
  onPrevious,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <nav aria-label="Paginação dos pedidos" className="flex items-center justify-between gap-4">
      <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={onPrevious}>
        Anterior
      </Button>
      <p aria-live="polite">
        Página {page} de {totalPages} <span className="text-muted-foreground">({total} {total === 1 ? 'pedido' : 'pedidos'})</span>
      </p>
      <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>
        Próxima
      </Button>
    </nav>
  )
}
