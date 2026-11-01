import { useId, useRef } from 'react'

import { Search, X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

/** Props de {@link SearchInput}. */
interface SearchInputProps {
  /** Texto atual da busca. */
  value: string
  /** Notifica cada alteração do texto. */
  onChange: (value: string) => void
}

/**
 * Campo de busca controlado do catálogo, com rótulo acessível e botão de limpar
 * que devolve o foco ao input.
 *
 * @param props - {@link SearchInputProps}
 * @returns Campo de busca com ícone e ação de limpeza.
 * @example
 * <SearchInput value={query} onChange={setQuery} />
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div role="search" aria-label="Buscar no catálogo" className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Buscar NFTs
      </label>

      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
      />

      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar NFTs"
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          'h-10 w-full rounded-[5px] border border-surface-dark bg-surface-card pr-10 pl-9 text-sm text-canvas placeholder:text-text-secondary/70',
          '[&::-webkit-search-cancel-button]:appearance-none',
          focusRing,
        )}
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          aria-label="Limpar busca"
          className={cn(
            'absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-[4px] text-text-secondary transition-colors hover:bg-surface-raised hover:text-canvas',
            focusRing,
          )}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  )
}
