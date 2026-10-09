import Minus from '@/assets/nft-detail/minus.svg?react';
import Plus from '@/assets/nft-detail/plus.svg?react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const stepperButtonVariants = cva(
  'bg-primary text-ink border-ink flex items-center justify-center rounded-full border disabled:opacity-40',
  {
    variants: {
      size: {
        default: 'h-12.5 w-8.25',
        compact: 'h-7.5 w-5',
        sm: 'h-7.5 w-5',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const stepperIconVariants = cva('', {
  variants: {
    size: {
      default: 'size-6',
      compact: 'size-4',
      sm: 'size-3 shrink-0',
    },
  },
  defaultVariants: { size: 'default' },
});

const stepperTextVariants = cva('', {
  variants: {
    size: {
      default: 'text-title',
      compact: 'text-lg font-medium',
      sm: 'text-body-17-regular',
    },
  },
  defaultVariants: { size: 'default' },
});

type QuantityStepperProps = VariantProps<typeof stepperButtonVariants> & {
  value: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  compact?: boolean;
  className?: string;
};

export function QuantityStepper({
  value,
  max,
  disabled,
  onChange,
  compact = false,
  size,
  className,
}: QuantityStepperProps) {
  const resolvedSize = size ?? (compact ? 'compact' : 'default');
  const buttonClass = stepperButtonVariants({ size: resolvedSize });
  const iconClass = stepperIconVariants({ size: resolvedSize });
  return (
    <div
      role="group"
      aria-label="Selecionar quantidade"
      className={cn('flex items-center gap-3', className)}
    >
      <button
        type="button"
        className={buttonClass}
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= 1 || max < 1}
        onClick={() => onChange(Math.min(value - 1, max))}
      >
        <Minus className={iconClass} aria-hidden="true" />
      </button>
      <output
        aria-label="Quantidade"
        className={stepperTextVariants({ size: resolvedSize })}
      >
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className={iconClass} aria-hidden="true" />
      </button>
    </div>
  );
}
