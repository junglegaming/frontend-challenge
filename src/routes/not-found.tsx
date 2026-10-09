import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/not-found')({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="border-border bg-surface-card space-y-4 rounded-md border p-8 text-center font-mono">
      <h1 className="text-display text-coral font-bold">404</h1>
      <p className="text-body text-text-secondary">Página não encontrada</p>
      <div>
        <Link
          to="/"
          search={{ sort: 'relevance', page: 1 }}
          className="border-primary bg-primary/20 text-tiny text-primary hover:bg-primary/30 inline-block rounded border px-4 py-2"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
