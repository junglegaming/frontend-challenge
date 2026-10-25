interface FieldErrorProps {
  id: string
  message?: string
}

/** Ligue ao campo com aria-describedby={id} e aria-invalid. */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      <span aria-hidden="true">⚠ </span>
      {message}
    </p>
  )
}
