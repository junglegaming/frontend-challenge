import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useId, useState } from 'react';

export function CouponInput({
  coupon,
  error,
  pending,
  onApply,
  onRemove,
}: {
  coupon?: string;
  error: string;
  pending: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const [code, setCode] = useState('');
  return (
    <form
      className="flex min-w-0 flex-col items-start"
      aria-label="Cupom promocional"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(code);
      }}
      aria-busy={pending}
    >
      <label htmlFor={id} className="mb-2">
        Código promocional
      </label>
      <Field className="mb-6">
        <ButtonGroup>
          <Input
            className="text-body-sm h-10"
            id={id}
            placeholder="Digite o código promocional..."
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            disabled={pending}
          />
          <Button>Aplicar</Button>
        </ButtonGroup>
      </Field>
      {coupon && <p>Cupom aplicado: {coupon}</p>}
      {(coupon || error) && (
        <Button
          className="ms-auto"
          type="button"
          disabled={pending}
          variant="outline"
          size="sm"
          onClick={() => {
            setCode('');
            onRemove();
          }}
        >
          Remover cupom
        </Button>
      )}
      <p id={`${id}-error`} aria-live="polite">
        {error}
      </p>
    </form>
  );
}
