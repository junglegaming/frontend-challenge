import type { CatalogFacets } from '@/lib/http/schemas';
import type { CatalogFilterState } from './search-params';

export interface CatalogControlsProps {
  filters: CatalogFilterState;
  facets?: CatalogFacets;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onChange: (next: Partial<CatalogFilterState>) => void;
  onSearch: (query: string) => void;
}
