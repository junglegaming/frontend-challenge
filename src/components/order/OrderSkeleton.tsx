import { Skeleton } from '@/components/ui/skeleton'

export function OrderSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[578px]" aria-hidden="true">
      <p role="status" className="sr-only">
        Carregando pedido…
      </p>
      <div className="border border-border bg-card">
        <div className="flex flex-col items-center gap-4 px-6 py-10">
          <Skeleton className="size-20 rounded-sm" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 border-y border-border px-6 py-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-4 px-6 py-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-14 shrink-0 rounded-sm" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="h-2.5 w-full bg-primary" />
      </div>
    </div>
  )
}
