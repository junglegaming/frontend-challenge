import { useRef, useState, type FormEventHandler } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import type { AppError } from '@/lib/http/errors';
import type { Session } from '@/types/api';
import { getStoredSession } from '@/lib/session/storage';

export function useAuthSubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  authenticate: (input: T) => Promise<Session>,
  onSuccess: () => Promise<void>
) {
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  const mutation = useMutation({ mutationFn: authenticate });
  const submit: FormEventHandler<HTMLFormElement> = (event) => {
    void form.handleSubmit(async (input) => {
      if (submitting.current) return;
      submitting.current = true;
      setMessage('');
      try {
        const session = await mutation.mutateAsync(input);
        if (getStoredSession()?.token !== session.token) {
          setMessage('Sua sessão expirou. Entre novamente.');
          return;
        }
        await onSuccess();
      } catch (failure) {
        const error = failure as AppError;
        if (error.kind === 'canceled') return;
        const fields =
          error.kind === 'validation' || error.kind === 'http'
            ? error.fields
            : undefined;
        let first: FieldPath<T> | undefined;
        for (const [name, errors] of Object.entries(fields ?? {})) {
          if (!Object.hasOwn(form.getValues(), name)) continue;
          const fieldName = name as FieldPath<T>;
          form.setError(fieldName, {
            type: 'server',
            message: errors.join(' '),
          });
          first ??= fieldName;
        }
        if (first) form.setFocus(first);
        else
          setMessage(
            error.kind === 'http' && error.code === 'UNAUTHORIZED'
              ? 'E-mail ou senha incorretos'
              : error.kind === 'network'
                ? 'Não foi possível conectar. Tente novamente.'
                : 'message' in error
                  ? error.message
                  : 'Não foi possível concluir. Tente novamente.'
          );
      } finally {
        submitting.current = false;
      }
    })(event);
  };
  return {
    submit,
    isPending: mutation.isPending || form.formState.isSubmitting,
    message,
  };
}
