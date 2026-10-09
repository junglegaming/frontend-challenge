import { displayEth } from '@/lib/money';

export function Price({
  value,
  previousPrice,
}: {
  value: string;
  previousPrice?: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <span className="text-accent">{displayEth(value)}</span>
      {previousPrice && (
        <span className="text-text-secondary">{displayEth(previousPrice)}</span>
      )}
    </span>
  );
}
