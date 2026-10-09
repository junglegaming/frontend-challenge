import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { parseCatalogSearch } from '@/features/catalog/search-params';

export const Route = createFileRoute('/')({
  validateSearch: parseCatalogSearch,
  search: { middlewares: [stripSearchParams({ sort: 'relevance', page: 1 })] },
});
