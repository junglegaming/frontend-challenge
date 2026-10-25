import { cn } from '@/lib/utils'
import type { NftTab } from '@/schemas/nft'

const TABS: { id: NftTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

interface CatalogTabsProps {
  value: NftTab
  onChange: (tab: NftTab) => void
}

export function CatalogTabs({ value, onChange }: CatalogTabsProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar catálogo"
      className="flex flex-nowrap items-center gap-x-1 gap-y-2 text-[15px] sm:gap-x-5"
    >
      {TABS.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-0 leading-5 whitespace-nowrap text-foreground transition-colors hover:text-accent-text md:pb-2 md:leading-4',
              active &&
                'font-bold text-accent-text after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
