import { Skeleton } from '@/shared/ui/skeleton'

/** Same footprint as the loaded summary, so nothing shifts when the quote arrives. */
export function SummarySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-10" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  )
}

/** Single polite live region for connection, value changes and submission feedback (FR-020). */
export function LiveRegion({ message }: { message: string }) {
  return (
    <p aria-live="polite" className="sr-only">
      {message}
    </p>
  )
}
