import { Link } from '@tanstack/react-router'
import { CATEGORY_LABELS, NFT_CATEGORIES, type NftCategory } from '@/domains/catalog'

export function CategoryTiles() {
  return (
    <section aria-labelledby="market-categories-heading" className="flex flex-col gap-4">
      <h2 id="market-categories-heading" className="text-title font-bold">
        Categorias
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {NFT_CATEGORIES.map((category) => (
          <li key={category}>
            <CategoryTile category={category} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CategoryTile({ category }: { category: NftCategory }) {
  return (
    <Link
      to="/"
      search={{ category: [category] }}
      className="flex items-center justify-center rounded-lg border border-border bg-card px-4 py-6 text-center text-body font-bold hover:bg-muted focus-visible:outline-3 focus-visible:outline-ring"
    >
      {CATEGORY_LABELS[category]}
    </Link>
  )
}
