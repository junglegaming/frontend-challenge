import type { Pagination as PaginationState } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'

type PageToken = number | 'ellipsis-start' | 'ellipsis-end'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const buttonBaseClass = cn(
  'inline-flex size-[35px] cursor-pointer items-center justify-center rounded-[4px] font-mono text-[18px] leading-4 transition-colors duration-150',
  focusRing,
)

/**
 * Gera os tokens de página exibidos: no máximo sete posições, com reticências
 * quando a janela não alcança as extremidades.
 */
function getPageTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages]
  }

  if (page >= totalPages - 3) {
    return [
      1,
      'ellipsis-start',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [1, 'ellipsis-start', page - 1, page, page + 1, 'ellipsis-end', totalPages]
}

/** Props de {@link Pagination}. */
interface PaginationProps {
  /** Estado de paginação retornado pela API. */
  pagination: PaginationState
  /** Solicita outra página. */
  onChange: (page: number) => void
}

/**
 * Controles de paginação do catálogo conforme Figma (`Pagination`, 207px wide, gap: 8px).
 *
 * @param props - {@link PaginationProps}
 * @returns Navegação de páginas, ou `null` quando não há páginas.
 */
export function Pagination({ pagination, onChange }: PaginationProps) {
  const { page, totalPages } = pagination

  if (totalPages < 1) return null

  const tokens = getPageTokens(page, totalPages)

  return (
    <nav aria-label="Paginação do catálogo" className="flex flex-row items-center gap-2">
      {page > 1 && (
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          aria-label="Anterior"
          title="Anterior"
          className={cn(
            buttonBaseClass,
            'border border-[#3F2319] text-foreground hover:border-primary hover:text-highlight hover:bg-[#3F2319]/30',
          )}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 18 18"
            className="size-[18px] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4.5l-4.5 4.5 4.5 4.5" />
          </svg>
        </button>
      )}

      <ol className="flex flex-row items-center gap-2">
        {tokens.map((token) =>
          typeof token === 'number' ? (
            <li key={token}>
              <button
                type="button"
                onClick={() => onChange(token)}
                aria-current={token === page ? 'page' : undefined}
                aria-label={`Página ${token}`}
                className={cn(
                  buttonBaseClass,
                  token === page
                    ? 'bg-primary font-bold text-ink hover:bg-highlight'
                    : 'border border-[#3F2319] font-normal text-foreground hover:border-primary hover:text-highlight hover:bg-[#3F2319]/30',
                )}
              >
                {token}
              </button>
            </li>
          ) : (
            <li
              key={token}
              aria-hidden="true"
              className="px-1 font-mono text-[14px] text-text-secondary"
            >
              …
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima"
        title="Próxima"
        className={cn(
          buttonBaseClass,
          'border border-[#3F2319] text-foreground hover:border-primary hover:text-highlight hover:bg-[#3F2319]/30',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#3F2319] disabled:hover:text-foreground disabled:hover:bg-transparent',
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 18 18"
          className="size-[18px] shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 4.5l4.5 4.5L7 13.5" />
        </svg>
      </button>

      <span className="sr-only" aria-live="polite">
        Página {page} de {totalPages}
      </span>
    </nav>
  )
}
