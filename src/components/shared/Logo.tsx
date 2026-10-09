import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      search={{ sort: 'relevance', page: 1 }}
      className={cn(
        'text-body-sm w-40 leading-[34.3px] font-bold tracking-[1.4px]',
        className
      )}
    >
      KURIO
    </Link>
  );
}
