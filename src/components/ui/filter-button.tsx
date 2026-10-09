import { Button, type ButtonProps } from './button';
import FilterIcon from '@/assets/filter.svg?react';
import { cn } from '@/lib/utils';

export function FilterButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        'bg-brand-gradient h-11.25 w-11.25 rounded-[14px]',
        className
      )}
      size="icon"
      aria-label="Abrir filtros"
      {...props}
    >
      <FilterIcon />
    </Button>
  );
}
