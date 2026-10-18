import { useState } from "react";

const collections = [
  { label: "Arte digital", count: 33 },
  { label: "Fotografia", count: 12 },
  { label: "Música", count: 65 },
  { label: "Arte 3D", count: 39 },
  { label: "Colecionáveis", count: 23 },
  { label: "Generativa", count: 17 },
  { label: "Jogos", count: 19 },
  { label: "Assinaturas", count: 13 },
  { label: "Utilidade", count: 18 },
];

const networks = [
  { label: "Ethereum", count: 119 },
  { label: "Polygon", count: 78 },
  { label: "Solana", count: 86 },
];

interface FilterListProps {
  items: { label: string; count: number }[];
  activeIndex?: number;
}

interface CatalogSidebarProps {
  initialMinPrice?: string;
  initialMaxPrice?: string;
  onApplyPrice: (min: string, max: string) => void;
}

function FilterList({ items, activeIndex }: FilterListProps) {
  return (
    <ul className="mt-3 space-y-0.5 text-[11px]">
      {items.map((item, index) => (
        <li key={item.label}>
          <button
            type="button"
            className={`flex w-full items-center justify-between py-1.5 pl-3 text-left ${
              index === activeIndex
                ? "text-[#d4893f]"
                : "text-zinc-300 hover:text-zinc-100"
            }`}
          >
            <span>{item.label}</span>
            <span>({item.count})</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CatalogSidebar({
  initialMinPrice = "",
  initialMaxPrice = "",
  onApplyPrice,
}: CatalogSidebarProps) {
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  return (
    <aside
      aria-label="Filtros do catálogo"
      className="bg-[#241612] px-5 py-5"
    >
      <section aria-labelledby="filter-collections">
        <h2
          id="filter-collections"
          className="text-xs font-bold text-zinc-100"
        >
          Coleções
        </h2>

        <FilterList items={collections} activeIndex={0} />
      </section>

      <section aria-labelledby="filter-price" className="mt-5">
        <h2
          id="filter-price"
          className="text-xs font-bold text-zinc-100"
        >
          Faixa de preço
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="min-price"
              className="text-[10px] text-zinc-400"
            >
              Mín.
            </label>

            <input
              id="min-price"
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="0.00"
              className="mt-1 w-full border border-[#4a3226] bg-[#1a110d] px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-[#d4893f]"
            />
          </div>

          <div>
            <label
              htmlFor="max-price"
              className="text-[10px] text-zinc-400"
            >
              Máx.
            </label>

            <input
              id="max-price"
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="12.30"
              className="mt-1 w-full border border-[#4a3226] bg-[#1a110d] px-2 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-[#d4893f]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onApplyPrice(minPrice, maxPrice)}
          className="mt-3 rounded-sm bg-[#d4893f] px-3 py-1 text-[11px] font-medium text-[#1a110d] hover:bg-[#e09a52]"
        >
          Aplicar
        </button>
      </section>

      <section aria-labelledby="filter-network" className="mt-5">
        <h2
          id="filter-network"
          className="text-xs font-bold text-zinc-100"
        >
          Rede
        </h2>

        <FilterList items={networks} />
      </section>
    </aside>
  );
}