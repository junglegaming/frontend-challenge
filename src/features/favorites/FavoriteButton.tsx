import Heart from '@/assets/nft-detail/heart.svg?react';
import { cn } from '@/lib/utils';

export function FavoriteButton({
  selected,
  pending,
  onClick,
  compact = false,
}: {
  selected: boolean;
  pending: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? 'Remover dos favoritos' : 'Favoritar NFT'}
      disabled={pending}
      onClick={onClick}
      className={cn(
        'border-primary text-text-accent inline-flex shrink-0 items-center justify-center gap-2 border disabled:cursor-wait disabled:opacity-60',
        selected && 'bg-primary/10',
        compact
          ? 'bg-surface-raised border-border size-9 rounded-full'
          : 'text-body-medium rounded-default h-10 w-32.5'
      )}
    >
      <Heart
        className={selected ? 'size-5 drop-shadow-sm' : 'size-5'}

        aria-hidden="true"
      />
      {!compact && (selected ? 'Favoritado' : 'Favoritar')}
    </button>
  );
}
