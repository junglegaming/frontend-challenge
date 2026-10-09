import { Skeleton } from '@/components/ui/skeleton';

export function NFTCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-square rounded-lg" />
      <Skeleton className="mt-3 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}
