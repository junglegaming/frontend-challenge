import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="border-border rounded-lg border p-8 text-center">
      <h2 className="text-h2 font-bold">{title}</h2>
      <p className="text-text-secondary my-4">{description}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
