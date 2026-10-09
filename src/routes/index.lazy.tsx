import { createLazyFileRoute } from '@tanstack/react-router';
import { CatalogPage } from '@/features/catalog/components/CatalogPage';

export const Route = createLazyFileRoute('/')({ component: CatalogPage });
