import { cn } from 'cn';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-shimmer bg-surface-raised rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
