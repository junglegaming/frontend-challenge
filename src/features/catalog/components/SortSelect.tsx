import { useEffect, useId, useRef, useState } from 'react'

import { Check } from 'lucide-react'

import type { NftSort } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Listados recentemente' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
] as const satisfies ReadonlyArray<{ value: NftSort; label: string }>

/** Props de {@link SortSelect}. */
interface SortSelectProps {
  /** Ordenação atual; ausente equivale a "Listados recentemente". */
  value?: NftSort | undefined
  /** Notifica a nova ordenação escolhida. */
  onChange: (sort: NftSort) => void
}

/**
 * Seletor de ordenação do catálogo, estilizado com base no tema Kurio:
 * Exibe "Ordenar por: [Opção] ▾" e abre um menu popover temático escuro
 * com acabamento em tons de âmbar, sombras profundas e ícone de seleção.
 *
 * @param props - {@link SortSelectProps}
 * @returns Seletor de ordenação com menu personalizado.
 */
export function SortSelect({ value, onChange }: SortSelectProps) {
  const selectId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentOption =
    SORT_OPTIONS.find((item) => item.value === (value ?? 'newest')) ?? SORT_OPTIONS[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleSelect(optionValue: NftSort) {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-1.5 font-mono text-[15px] leading-5 text-foreground"
    >
      <label
        htmlFor={selectId}
        className="cursor-pointer font-normal whitespace-nowrap text-foreground"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Ordenar por:
      </label>

      {/* Botão Gatilho do Dropdown */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'group relative flex cursor-pointer items-center gap-1.5 rounded-[4px] px-1.5 py-0.5 font-normal text-foreground transition-colors hover:text-highlight',
          isOpen && 'text-highlight',
          focusRing,
        )}
      >
        <span className="whitespace-nowrap">{currentOption.label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6.5l4 4 4-4" />
        </svg>
      </button>

      {/* Menu Popover Customizado Temático */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Opções de ordenação"
          className="absolute top-full right-0 z-50 mt-2 min-w-[210px] overflow-hidden rounded-[8px] border border-[#38220F] bg-card p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.85)] animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === (value ?? 'newest')
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-[5px] px-3 py-2 text-left font-mono text-[14px] leading-5 transition-colors',
                  isSelected
                    ? 'bg-surface-dark font-bold text-highlight'
                    : 'font-normal text-foreground hover:bg-surface-raised hover:text-highlight',
                  focusRing,
                )}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <Check
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                    strokeWidth={2.5}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Select nativo oculto para compatibilidade total com testes automatizados e formulários */}
      <select
        id={selectId}
        value={value ?? 'newest'}
        onChange={(event) => {
          const option = SORT_OPTIONS.find((item) => item.value === event.target.value)
          if (option) onChange(option.value)
        }}
        aria-label="Ordenar por"
        tabIndex={-1}
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-[0.01]"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
