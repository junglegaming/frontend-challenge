import { Button } from '@/shared/ui/button'

/** Previous/next through the cursor stack kept in the URL. The service only gives the next cursor, never the previous. */
export function OwnersPager({
  pageNumber,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: {
  pageNumber: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <nav aria-label="Paginação dos donos" className="flex items-center justify-between gap-4">
      <Button type="button" variant="outline" size="sm" disabled={!hasPrevious} onClick={onPrevious}>
        Anterior
      </Button>
      <p aria-live="polite">Página {pageNumber}</p>
      <Button type="button" variant="outline" size="sm" disabled={!hasNext} onClick={onNext}>
        Próxima
      </Button>
    </nav>
  )
}
