interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CatalogPaginationProps) {
  return (
    <div>
      {totalPages > 1 && (
        <nav
          aria-label="Paginação do catálogo"
          className=" flex items-center justify-center gap-2 sm:justify-end"
        >
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? "page" : undefined}
                className={`cursor-pointer flex h-11 min-w-11 items-center justify-center rounded-lg border px-4 text-base transition-colors sm:h-10 sm:min-w-10 sm:px-3 sm:text-sm ${
                  currentPage === page
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)]"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Próxima página"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  );
}
