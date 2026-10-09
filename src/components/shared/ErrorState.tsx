import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry: () => void;
  actionLabel?: string;
  variant?: 'panel' | 'compact';
}

export function ErrorState({
  title,
  description,
  onRetry,
  actionLabel = 'Tentar novamente',
  variant = 'panel',
}: ErrorStateProps) {
  if (variant === 'compact') {
    return (
      <div
        role="alert"
        className="border-coral text-body-sm mt-4 space-y-3 rounded border p-4"
      >
        <p>{title}</p>
        <Button variant="outline" onClick={onRetry}>
          {actionLabel}
        </Button>
      </div>
    );
  }
  return (
    <div role="alert" className="border-coral rounded-lg border p-8">
      <h2 className="text-h2 font-bold">{title}</h2>
      {description && <p className="text-text-secondary my-4">{description}</p>}
      <Button onClick={onRetry}>{actionLabel}</Button>
    </div>
  );
}
