import { Link, type LinkComponentProps } from '@tanstack/react-router';
import { cn } from 'cn';

export function ActiveLink({ className, ...props }: LinkComponentProps) {
  return (
    <Link
      {...props}
      className={cn(
        'text-lg-bold text-foreground hover:text-accent [&.active]:text-accent relative pb-5 transition-colors',
        'after:bg-primary after:absolute after:bottom-0 after:left-0 after:h-0.75 after:w-full',
        'after:opacity-0 [&.active]:after:opacity-100',
        className
      )}
    />
  );
}
