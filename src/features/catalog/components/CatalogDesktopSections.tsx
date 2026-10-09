import { useEffect } from 'react';
import { CatalogEditorial } from './CatalogEditorial';
import { CatalogDiary } from './CatalogDiary';

export function CatalogDesktopSections() {
  useEffect(() => {
    // Preserve direct links to an anchor whose section arrives in a lazy chunk.
    if (window.location.hash === '#diario')
      document.getElementById('diario')?.scrollIntoView();
  }, []);
  return (
    <>
      <CatalogEditorial />
      <CatalogDiary />
    </>
  );
}
