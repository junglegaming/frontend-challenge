import { Button } from '@/components/ui/button';

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from(
    { length: Math.min(5, count) },
    (_, i) => Math.max(1, Math.min(page - 2, count - 4)) + i
  );
  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-10 flex flex-wrap justify-end gap-2 md:mt-22"
    >
      <Button
        variant="outline"
        size="icon"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </Button>
      {pages.map((value) => (
        <Button
          key={value}
          size="icon"
          variant={page === value ? 'default' : 'outline'}
          aria-label={`Página ${value}`}
          aria-current={page === value ? 'page' : undefined}
          onClick={() => onChange(value)}
        >
          {value}
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        aria-label="Próxima página"
        disabled={page >= count}
        onClick={() => onChange(page + 1)}
      >
        ›
      </Button>
    </nav>
  );
}
