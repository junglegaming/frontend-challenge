import { useId, type ComponentProps } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  labelHidden = true,
  ...props
}: Omit<ComponentProps<typeof Input>, 'name'> & {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  labelHidden?: boolean;
}) {
  const fieldId = useId();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `${fieldId}-${name}`;
        const InputComponent =
          props.type === 'password' ? PasswordInput : Input;
        return (
          <FormItem>
            <FormLabel
              className={labelHidden ? 'sr-only' : undefined}
              htmlFor={id}
            >
              {label}
              {props.required && <span aria-hidden="true"> *</span>}
            </FormLabel>
            <InputComponent
              {...props}
              {...field}
              id={id}
              aria-invalid={!!fieldState.error}
              aria-describedby={
                [
                  description && `${id}-description`,
                  fieldState.error && `${id}-error`,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              className="border-border-soft text-body-sm placeholder:text-text-secondary rounded-default h-12 bg-transparent px-4 md:h-10"
            />
            {description && (
              <FormDescription id={`${id}-description`}>
                {description}
              </FormDescription>
            )}
            <FormMessage id={`${id}-error`} />
          </FormItem>
        );
      }}
    />
  );
}
