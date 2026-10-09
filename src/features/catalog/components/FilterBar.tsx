import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CatalogFacets } from '@/lib/http/schemas';
import { Slider } from '@/components/ui/slider';
import { ethSchema } from '@/lib/http/schemas';
import {
  cmpEth,
  ethToPriceStep,
  priceStepToEth,
  priceSliderLimit,
  formatPriceRangeValue,
} from '@/lib/money';
import type { CatalogFilterState } from '../search-params';

const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
];

export function FilterBar({
  filters,
  onChange,
  facets,
  loading,
  failed,
  onRetry,
}: {
  filters: CatalogFilterState;
  facets?: CatalogFacets;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onChange: (next: Partial<CatalogFilterState>) => void;
}) {
  const id = useId();
  const [min, setMin] = useState(filters.minPrice ?? '');
  const [max, setMax] = useState(filters.maxPrice ?? '');
  const [edited, setEdited] = useState([false, false]);
  const limit = priceSliderLimit(filters.minPrice, filters.maxPrice);
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState('');
  const prices = [min || '0', max || limit];
  const positions = prices.map(ethToPriceStep);
  const rangeText = `Preço: ${formatPriceRangeValue(prices[0])} - ${formatPriceRangeValue(prices[1])} ETH`;
  function applyPrice() {
    if (
      (min && !ethSchema.safeParse(min).success) ||
      (max && !ethSchema.safeParse(max).success)
    ) {
      setError('Informe preços decimais válidos, por exemplo 0.02.');
      return;
    }
    if (min && max && cmpEth(min, max) > 0) {
      setError('O preço mínimo deve ser menor ou igual ao máximo.');
      return;
    }
    setError('');
    onChange({
      minPrice: !min || (edited[0] && cmpEth(min, '0') === 0) ? undefined : min,
      maxPrice:
        !max || (edited[1] && cmpEth(max, limit) === 0) ? undefined : max,
    });
  }
  function count(id: string, kind: keyof CatalogFacets) {
    if (failed) return <span aria-label="Contagem indisponível">—</span>;
    if (loading || !facets)
      return <Skeleton className="h-4 w-9" aria-label="Carregando contagem" />;
    return (
      <span className={kind === 'categories' ? 'font-bold' : undefined}>
        ({facets[kind].find((item) => item.id === id)?.count ?? 0})
      </span>
    );
  }
  const headingClass = 'mb-3 text-lg font-bold leading-4';
  const rowClass =
    'relative flex h-10 w-full cursor-pointer items-center justify-between gap-2 text-body leading-10';
  const inputClass = 'peer sr-only';
  const focusClass =
    'pointer-events-none absolute inset-0 rounded-default peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-card';
  return (
    <div className="bg-surface-card space-y-10 p-5" data-slot="catalog-filters">
      <fieldset className="min-w-0">
        <legend className={headingClass}>Coleções</legend>
        <p id={`${id}-collections-help`} className="sr-only">
          Selecione uma coleção. Para remover o filtro, desmarque a coleção
          selecionada.
        </p>
        <div className="px-3">
          {categories.map((category) => {
            const checked = filters.categories?.includes(category) ?? false;
            return (
              <label
                key={category}
                className={cn(
                  rowClass,
                  checked ? 'text-text-accent' : 'text-text-secondary'
                )}
              >
                <input
                  type="checkbox"
                  aria-label={category}
                  aria-describedby={`${id}-collections-help`}
                  className={inputClass}
                  checked={checked}
                  onChange={(event) => {
                    onChange({
                      categories: event.target.checked ? [category] : undefined,
                    });
                  }}
                />
                <span className={focusClass} />
                <span>{category}</span>
                {count(category, 'categories')}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className={headingClass}>Faixa de preço</legend>
        <div className="space-y-3 pl-3">
          <Slider
            className="h-5.25 [&_[role=slider]]:size-5.25"
            min={0}
            max={ethToPriceStep(limit)}
            step={1}
            value={positions}
            thumbLabels={['Preço mínimo', 'Preço máximo']}
            thumbValueTexts={prices.map(
              (price) => `${formatPriceRangeValue(price)} ETH`
            )}
            aria-describedby={error ? `${id}-error` : `${id}-range`}
            aria-invalid={!!error}
            onValueChange={(next) => {
              if (next[0] !== positions[0]) setMin(priceStepToEth(next[0]));
              if (next[1] !== positions[1]) setMax(priceStepToEth(next[1]));
              setEdited((previous) => [
                previous[0] || next[0] !== positions[0],
                previous[1] || next[1] !== positions[1],
              ]);
              setError('');
            }}
            onValueCommit={(next) =>
              setAnnouncement(
                `Preço: ${next.map((position, index) => formatPriceRangeValue(position === positions[index] ? prices[index] : priceStepToEth(position))).join(' - ')} ETH`
              )
            }
          />
          <p
            id={`${id}-range`}
            className="text-body text-foreground leading-5 wrap-break-word"
          >
            {rangeText}
          </p>
          <span className="sr-only" aria-live="polite">
            {announcement}
          </span>
          {error && (
            <p id={`${id}-error`} className="text-tiny text-coral" role="alert">
              {error}
            </p>
          )}
          <Button
            size="sm"
            className="text-ink rounded-default h-9 px-3 py-2 text-base leading-5 font-bold shadow-none"
            onClick={applyPrice}
          >
            Aplicar
          </Button>
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className={headingClass}>Rede</legend>
        <div className="pl-3">
          {(['ethereum', 'polygon', 'solana'] as const).map((network) => {
            const name = {
              ethereum: 'Ethereum',
              polygon: 'Polygon',
              solana: 'Solana',
            }[network];
            const checked = filters.networks?.includes(network) ?? false;
            return (
              <label
                key={network}
                className={cn(
                  rowClass,
                  checked ? 'text-text-accent' : 'text-text-secondary'
                )}
              >
                <input
                  type="checkbox"
                  aria-label={name}
                  className={inputClass}
                  checked={checked}
                  onChange={(event) => {
                    const selected = event.target.checked
                      ? [...(filters.networks ?? []), network]
                      : filters.networks?.filter((value) => value !== network);
                    onChange({
                      networks: selected?.length ? selected : undefined,
                    });
                  }}
                />
                <span className={focusClass} />
                <span>{name}</span>
                {count(network, 'networks')}
              </label>
            );
          })}
        </div>
      </fieldset>
      {failed && (
        <div role="alert" className="text-tiny text-coral">
          <p>Não foi possível carregar as contagens.</p>
          <Button variant="link" size="xsm" onClick={onRetry}>
            Tentar novamente contagens
          </Button>
        </div>
      )}
    </div>
  );
}
