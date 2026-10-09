import { Link } from '@tanstack/react-router';
import type { CatalogFilterState } from '../search-params';
import { Button } from '@/components/ui/button';
import ArrowIcon from '@/assets/arrow-right.svg?react';

const catalogList = [
  [
    'golden-signal-160',
    'Lançamentos gênesis de edição limitada',
    'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    'recent',
  ],
  [
    'golden-frequency-071',
    'Arte digital selecionada e muito mais',
    'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    'relevance',
  ],
] as const;

export function CatalogEditorial() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-y-10 md:mt-24 md:gap-x-7 lg:grid-cols-2">
      {catalogList.map(([image, title, description, sort]) => (
        <div
          key={title}
          className="bg-surface-card grid grid-cols-2 rounded-md"
        >
          <img
            src={`/assets/nft/${image}.png`}
            alt="NFT Image"
            className="h-62.5 w-73 rounded-[18px]"
          />
          <div className="grid pt-9.25 pr-7.5">
            <div>
              <h2 className="text-body-18-bold mb-1 text-right leading-6">
                {title}
              </h2>
              <p className="text-tiny text-text-secondary text-right leading-6">
                {description}
              </p>
            </div>
            <Button className="text-ink" asChild>
              <Link
                className="ms-auto inline-block"
                to="/"
                search={{ sort: sort as CatalogFilterState['sort'], page: 1 }}
              >
                Explorar <ArrowIcon />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
