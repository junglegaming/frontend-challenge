import { createFileRoute } from '@tanstack/react-router';
import { parseCatalogSearch } from '@/features/catalog/search-params';
import { RoutePlaceholder } from '@/components/shared/RoutePlaceholder';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/teste')({
  validateSearch: parseCatalogSearch,
  component: IndexPage,
});
function IndexPage() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RoutePlaceholder
      title="Início"
      frames="2:2 (desktop) / 14:5226 (mobile)"
      description="Catálogo, busca, filtros, ordenação e paginação na URL."
    >
      <pre className="mb-4" aria-label="Filtros atuais">
        {JSON.stringify(filters, null, 2)}
      </pre>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="xsm"
          onClick={() =>
            navigate({
              search: (prev) => ({ ...prev, q: 'cyberpunk', page: 1 }),
            })
          }
        >
          Buscar cyberpunk
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xsm"
          onClick={() =>
            navigate({
              search: (prev) => ({
                ...prev,
                categories: ['Arte digital', 'Colecionáveis'],
                minPrice: '0.1',
                maxPrice: '5.0',
                sort: 'price_asc',
                page: 1,
              }),
            })
          }
        >
          Aplicar filtros
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xsm"
          onClick={() =>
            navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) })
          }
        >
          Próxima página
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xsm"
          onClick={() => navigate({ search: { sort: 'relevance', page: 1 } })}
        >
          Limpar filtros
        </Button>
      </div>
    </RoutePlaceholder>
  );
}
