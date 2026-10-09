import type { ReactNode } from 'react';
import { useSession } from '@/lib/session/state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const { isHydrating, error, retryHydration } = useSession();
  if (isHydrating)
    return (
      <div
        role="status"
        aria-label="Validando sessão"
        className="mx-auto grid max-w-lg gap-4 p-8"
      >
        <Skeleton className="h-12" />
        <Skeleton className="h-48" />
        <span className="sr-only">Validando sessão</span>
      </div>
    );
  if (error)
    return (
      <div role="alert" className="mx-auto grid max-w-lg gap-4 p-8">
        <h1 className="text-h2">Não foi possível validar a sessão</h1>
        <p>Verifique sua conexão e tente novamente.</p>
        <Button onClick={() => void retryHydration().catch(() => undefined)}>
          Tentar novamente
        </Button>
      </div>
    );
  return children;
}
