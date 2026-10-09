import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import type { CollectorFormValues } from './form-schema';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';

const fields = [
  [
    'walletconnect',
    <span className="text-accent text-tiny-bold border-border-soft rounded-default bg-surface-dark border px-[10.5px] py-1.75">
      METAMASK • WALLETCONNECT • COINBASE
    </span>,
  ],
  ['metamask', 'MetaMask'],
  ['coinbase', 'Coinbase Wallet'],
] as const;

export function WalletNetworkSelection() {
  const id = useId();
  const form = useFormContext<CollectorFormValues>();
  return (
    <FormField
      control={form.control}
      name="provider"
      render={({ field }) => (
        <FormItem className="pt-3">
          <FormLabel className="text-body-17-bold block text-center">
            Carteira e rede
          </FormLabel>
          <FormControl>
            <RadioGroup
              orientation="vertical"
              name={field.name}
              required
              value={field.value}
              onValueChange={field.onChange}
              aria-label="Carteira e rede"
              className="grid"
              disabled={form.formState.isSubmitting}
            >
              {fields.map(([value, label]) => (
                <FieldLabel key={value} htmlFor={`${id}-${value}`}>
                  <Field orientation="horizontal">
                    <RadioGroupItem
                      className="self-center"
                      id={`${id}-${value}`}
                      value={value}
                      aria-labelledby={`${id}-${value}-label`}
                      onBlur={field.onBlur}
                      ref={field.value === value ? field.ref : undefined}
                    />
                    <FieldContent>
                      <FieldTitle
                        id={`${id}-${value}-label`}
                        className="text-body"
                      >
                        {label}
                      </FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
