import type { ComponentProps } from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabels?: string[];
  thumbValueTexts?: string[];
};

export function Slider({
  className,
  value,
  defaultValue,
  thumbLabels,
  thumbValueTexts,
  ...props
}: SliderProps) {
  const values = value ?? defaultValue ?? [props.min ?? 0];
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      className={cn(
        'relative flex h-11 w-full touch-none items-center select-none data-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="bg-primary relative h-1 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumbLabels?.[index]}
          aria-valuetext={thumbValueTexts?.[index]}
          aria-describedby={props['aria-describedby']}
          aria-invalid={props['aria-invalid']}
          className="bg-primary border-ink focus-visible:ring-primary focus-visible:ring-offset-ink relative block size-5 shrink-0 cursor-grab rounded-full border-3 outline-none before:absolute before:-inset-3 before:rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 active:cursor-grabbing data-disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
