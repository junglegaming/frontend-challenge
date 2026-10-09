import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from 'radix-ui';

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center font-mono font-medium whitespace-nowrap transition-colors select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-ink font-bold hover:bg-primary-light active:bg-primary-dark shadow-xs',
        default:
          'bg-primary text-ink font-bold hover:bg-primary-light active:bg-primary-dark shadow-xs',
        secondary:
          'border border-border-soft bg-surface-card text-foreground hover:bg-surface-raised hover:border-border-soft active:bg-surface-dark',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-surface-card hover:border-border-soft active:bg-surface-raised',
        ghost:
          'bg-transparent text-foreground hover:bg-surface-raised active:bg-surface-dark',
        danger:
          'bg-error text-white font-medium hover:bg-error/90 active:bg-error/80 focus-visible:ring-error',
        pill: 'rounded-pill bg-primary text-ink font-bold hover:bg-primary-light active:bg-primary-dark',
        link: 'text-text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 text-sm rounded-default gap-2',
        md: 'h-10 px-4 text-sm rounded-default gap-2',
        xsm: 'h-8 px-3 text-xs rounded-sm gap-1.5',
        sm: 'h-9 px-3 py-2 text-xs rounded-sm gap-1.5',
        lg: 'h-12 px-6 text-base rounded-default gap-2.5',
        icon: 'size-10 rounded-default',
        'icon-sm': 'size-8 rounded-default',
        full: 'w-full h-10 px-4 text-sm rounded-default gap-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-disabled={props.disabled || props['aria-disabled']}
      className={cn(
        buttonVariants({ variant, size }),
        variant === 'pill' && 'rounded-pill',
        className
      )}
      {...props}
    />
  );
}
