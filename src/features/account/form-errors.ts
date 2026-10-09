import { useEffect } from 'react';
import type {
  FieldError,
  FieldValues,
  Path,
  UseFormReturn,
} from 'react-hook-form';
import type { AppError } from '@/types/api';

export function applyFormError<T extends FieldValues>(
  form: UseFormReturn<T>,
  failure: unknown,
  fields: Record<string, Path<T>>
) {
  const error = failure as AppError;
  if (error.kind === 'canceled') return '';
  if (error.kind === 'validation' || error.kind === 'http') {
    for (const [field, messages] of Object.entries(error.fields ?? {})) {
      if (fields[field]) {
        form.setError(fields[field], { type: 'server', message: messages[0] });
      }
    }
    return (
      error.fields?.form?.[0] ??
      (error.kind === 'http'
        ? error.message
        : 'Confira os campos e tente novamente.')
    );
  }
  return 'Não foi possível salvar. Tente novamente.';
}

export function useServerErrorFocus<T extends FieldValues>(
  form: UseFormReturn<T>
) {
  const { errors, isSubmitting } = form.formState;
  useEffect(() => {
    if (isSubmitting) return;
    const field = Object.entries(errors).find(
      ([, error]) => (error as FieldError | undefined)?.type === 'server'
    )?.[0];
    if (field) form.setFocus(field as Path<T>);
  }, [form, errors, isSubmitting]);
}
