import * as React from 'react';
import { Slot } from 'radix-ui';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Label } from './label';
import { cn } from '@/lib/utils';

const Form = FormProvider;
const FieldContext = React.createContext<{ name: string } | null>(null);
const ItemContext = React.createContext<string | null>(null);

function FormField<T extends FieldValues, N extends FieldPath<T>>(
  props: ControllerProps<T, N>
) {
  return (
    <FieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FieldContext.Provider>
  );
}
function useFormField() {
  const field = React.useContext(FieldContext);
  const id = React.useContext(ItemContext);
  const { getFieldState } = useFormContext();
  const state = useFormState({ name: field?.name });
  if (!field || !id)
    throw new Error('Use form components inside FormField and FormItem.');
  return {
    ...getFieldState(field.name, state),
    name: field.name,
    id,
    formItemId: id + '-control',
    formDescriptionId: id + '-description',
    formMessageId: id + '-message',
  };
}
function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId();
  return (
    <ItemContext.Provider value={id}>
      <div className={cn('grid min-w-0 gap-2', className)} {...props} />
    </ItemContext.Provider>
  );
}
function FormLabel(props: React.ComponentProps<typeof Label>) {
  const { formItemId, error } = useFormField();
  return <Label data-invalid={!!error} htmlFor={formItemId} {...props} />;
}
function FormControl(props: React.ComponentProps<typeof Slot.Root>) {
  const { formItemId, formDescriptionId, formMessageId, error } =
    useFormField();
  return (
    <Slot.Root
      {...props}
      id={formItemId}
      aria-invalid={!!error}
      aria-describedby={[
        props['aria-describedby'],
        formDescriptionId,
        error && formMessageId,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField();
  return (
    <p
      id={formDescriptionId}
      className={cn('text-caption text-text-secondary', className)}
      {...props}
    />
  );
}
function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField();
  const content = error ? String(error.message ?? '') : children;
  if (!content) return null;
  return (
    <p
      id={formMessageId}
      role="alert"
      className={cn('text-body-sm text-coral', className)}
      {...props}
    >
      <span aria-hidden="true">⚠ </span>
      {content}
    </p>
  );
}
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};
