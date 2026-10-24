import { cloneElement, useId, type ReactElement } from 'react'
import { AlertIcon } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import { Label } from './label'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  className?: string
  /** A single form control; Field wires id, aria-invalid and aria-describedby into it. */
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>
}

/** Label + control + associated error message (icon + text, announced to assistive tech). */
export function Field({ label, required, error, className, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1 text-caption text-destructive">
          <AlertIcon aria-hidden="true" strokeWidth={1.5} size={14} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
