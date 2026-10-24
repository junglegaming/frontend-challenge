import { MAX_CURSORS, coinsAdminErrorMessage, useOwnersPage } from '@/domains/coins-admin'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { OwnersPager } from './OwnersPager'
import { OwnersTable } from './OwnersTable'

/** The owners list with its loading, empty and error states. `cursors` is the stack that lives in the URL. */
export function OwnersPanel({ cursors, onCursorsChange }: { cursors: string[]; onCursorsChange: (cursors: string[]) => void }) {
  const owners = useOwnersPage(cursors)

  if (owners.isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">
        <span>{coinsAdminErrorMessage(owners.error)}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => void owners.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  if (!owners.data) {
    return <Skeleton aria-busy="true" aria-label="Carregando donos" className="h-64 w-full" />
  }

  const { data } = owners
  const cursor = data.cursor

  return (
    <div className="flex flex-col gap-4">
      {data.owners.length === 0 ? (
        <p className="text-muted-foreground">Nenhum dono de saldo ainda.</p>
      ) : (
        <OwnersTable owners={data.owners} />
      )}
      <OwnersPager
        pageNumber={cursors.length + 1}
        hasPrevious={cursors.length > 0}
        hasNext={cursor !== undefined && cursors.length < MAX_CURSORS}
        onPrevious={() => onCursorsChange(cursors.slice(0, -1))}
        onNext={() => cursor !== undefined && onCursorsChange([...cursors, cursor])}
      />
    </div>
  )
}
