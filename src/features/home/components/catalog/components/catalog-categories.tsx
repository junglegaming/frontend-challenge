import { useEffect, useState } from "react";
import { getCategoryCount, getNetworkCount } from "../utils/catalog-utils";

interface CatalogCategoriesProps {
  categories: string[];
  networks: string[];
  selectedCategory: string;
  selectedNetwork: string;
  maxPrice: number;
  onCategoryChange: (category: string) => void;
  onNetworkChange: (network: string) => void;
  onMaxPriceChange: (price: number) => void;
}

export function CatalogCategories({
  categories,
  networks,
  selectedCategory,
  selectedNetwork,
  maxPrice,
  onCategoryChange,
  onNetworkChange,
  onMaxPriceChange,
}: CatalogCategoriesProps) {
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setDraftMaxPrice(maxPrice);
  }, [maxPrice]);

  function handleApplyPrice() {
    onMaxPriceChange(draftMaxPrice);
  }

  return (
    <section className="space-y-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="mb-4 font-semibold text-[var(--color-text)]">
          Coleções
        </h2>

        <div className="space-y-1">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
                aria-pressed={isSelected}
                className={`cursor-pointer flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "font-semibold text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <span>{category}</span>
                <span>({getCategoryCount(category)})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-[var(--color-text)]">
            Faixa de preço
          </h2>
        </div>

        <input
          type="range"
          min={0.01}
          max={15}
          step={0.01}
          value={draftMaxPrice}
          onChange={(event) => setDraftMaxPrice(Number(event.target.value))}
          aria-label="Preço máximo em ETH"
          className="w-full accent-[var(--color-primary)]"
        />

        <div className="mt-1 flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>0,01 ETH</span>
          <span>
            {draftMaxPrice.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ETH
          </span>
        </div>

        <button
          type="button"
          onClick={handleApplyPrice}
          disabled={draftMaxPrice === maxPrice}
          className="mt-4 w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Aplicar preço
        </button>
      </div>

      <div className="border-t border-[var(--color-border)] pt-5">
        <h2 className="mb-4 font-semibold text-[var(--color-text)]">Rede</h2>

        <div className="space-y-1">
          {networks.map((network) => {
            const isSelected = selectedNetwork === network;

            return (
              <button
                key={network}
                type="button"
                onClick={() => onNetworkChange(network)}
                aria-pressed={isSelected}
                className={`cursor-pointer flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "font-semibold text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <span>{network}</span>
                <span>({getNetworkCount(network)})</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
