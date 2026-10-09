import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';

export function PasswordInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={className ? `${className} pr-12` : 'pr-12'}
      />
      <button
        type="button"
        disabled={props.disabled}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-controls={props.id}
        aria-pressed={visible}
        className="text-text-secondary rounded-default absolute inset-y-0 right-1 flex w-10 items-center justify-center"
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}
