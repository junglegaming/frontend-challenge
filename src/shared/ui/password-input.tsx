import { useState, type ComponentProps } from 'react'
import { EyeIcon, EyeOffIcon } from '@/shared/icons'
import { Input } from './input'

export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-sm text-primary focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
      >
        {visible ? <EyeIcon aria-hidden="true" strokeWidth={1.5} size={18} /> : <EyeOffIcon aria-hidden="true" strokeWidth={1.5} size={18} />}
      </button>
    </div>
  )
}
