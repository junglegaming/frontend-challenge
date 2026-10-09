import { Skeleton } from '@/components/ui/skeleton';

export function NftDetailSkeleton() {
  return (
    <section
      aria-label="Carregando detalhes do NFT"
      aria-busy="true"
      className="grid gap-8 p-6 md:p-0 lg:grid-cols-2"
    >
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-6">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
      <span role="status" className="sr-only">
        Carregando detalhes do NFT
      </span>
    </section>
  );
}
