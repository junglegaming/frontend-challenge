import { lazy, Suspense } from 'react';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useCatalog } from '../hooks/useCatalog';
import { CatalogHero } from './CatalogHero';
import { CatalogMobileControls } from './CatalogMobileControls';
import { CatalogSidebar } from './CatalogSidebar';
import { CatalogResults } from './CatalogResults';

const DesktopSections = lazy(() =>
  import('./CatalogDesktopSections').then((module) => ({
    default: module.CatalogDesktopSections,
  }))
);

export function CatalogPage() {
  const catalog = useCatalog();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const controls = {
    filters: catalog.filters,
    facets: catalog.query.data?.facets,
    loading: catalog.query.isPending,
    failed: catalog.query.isError,
    onRetry: catalog.onRetry,
    onChange: catalog.onFiltersChange,
    onSearch: catalog.onSearch,
  };

  return (
    <div className="mx-auto">
      <h1 className="sr-only">Início</h1>
      <CatalogMobileControls {...controls} />
      <CatalogHero />
      <section
        id="catalogo"
        className="mt-4 grid scroll-mt-6 gap-12 md:mt-24 md:grid-cols-[250px_minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)]"
      >
        <CatalogSidebar {...controls} />
        <CatalogResults catalog={catalog} />
      </section>
      {isDesktop && (
        <Suspense fallback={null}>
          <DesktopSections />
        </Suspense>
      )}
      <MobileNavigation />
    </div>
  );
}
