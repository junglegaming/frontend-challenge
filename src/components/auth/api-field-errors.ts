import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api/client'

/** Leva `ApiError.fields` para os campos do formulário; retorna se algum campo foi reconhecido. */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  names: readonly FieldPath<T>[],
): boolean {
  if (!(error instanceof ApiError)) return false
  let applied = false
  for (const [name, message] of Object.entries(error.fields)) {
    const field = names.find((candidate) => candidate === name)
    if (!field) continue
    setError(field, { type: 'server', message })
    applied = true
  }
  return applied
}
