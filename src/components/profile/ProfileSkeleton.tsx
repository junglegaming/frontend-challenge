import { Skeleton } from '@/components/ui/skeleton'

export function ProfileSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-8">
      <Skeleton className="h-4 w-52" />
      <div className="grid gap-7 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-10 w-full rounded-sm" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 rounded-sm" />
      <div className="mt-4 flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full max-w-[417px] rounded-sm" />
        ))}
      </div>
    </div>
  )
}
