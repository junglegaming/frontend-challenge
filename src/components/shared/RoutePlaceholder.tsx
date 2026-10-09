import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface RoutePlaceholderProps {
  title: string;
  frames?: string;
  access?: 'pública' | 'privada';
  description?: string;
  children?: ReactNode;
}

export function RoutePlaceholder({
  title,
  frames,
  access = 'pública',
  description,
  children,
}: RoutePlaceholderProps) {
  return (
    <div className="space-y-6">
      <header className="border-border border-b pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 text-foreground font-mono font-bold">
            {title}
          </h1>
          <span
            className={`text-tiny rounded px-2 py-0.5 font-mono tracking-wider uppercase ${
              access === 'privada'
                ? 'bg-amber/20 text-amber border-amber/30 border'
                : 'bg-primary/20 text-primary border-primary/30 border'
            }`}
          >
            {access}
          </span>
        </div>
        {frames && (
          <p className="text-tiny text-text-secondary mt-1">
            Frame de referência Figma:{' '}
            <span className="text-primary font-mono">{frames}</span>
          </p>
        )}
        {description && (
          <p className="text-body-sm text-foreground/80 mt-2">{description}</p>
        )}
      </header>

      {children && (
        <div className="border-border bg-surface-card rounded-md border p-4">
          {children}
        </div>
      )}

      <section className="border-border bg-surface-raised space-y-3 rounded-md border p-4">
        <h2 className="text-body-sm text-text-secondary font-bold tracking-wider uppercase">
          Navegação entre rotas do Marketplace
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            search={{ sort: 'relevance', page: 1 }}
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Início
          </Link>
          <Link
            to="/tokens"
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Design Tokens
          </Link>
          <Link
            to="/nfts/$nftId"
            search={{ qty: 1 }}
            params={{ nftId: 'golden-signal-160' }}
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Detalhes NFT (#1)
          </Link>
          <Link
            to="/cart"
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Carrinho
          </Link>
          <Link
            to="/checkout"
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Pagamento (Privada)
          </Link>
          <Link
            to="/orders/$orderId"
            params={{ orderId: 'ord_sample_123' }}
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Confirmação (Privada)
          </Link>
          <Link
            to="/login"
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Cadastro
          </Link>
          <Link
            to="/profile"
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Perfil (Privada)
          </Link>
          <Link
            to="/wallets"
            className="border-border bg-surface-card text-tiny text-foreground hover:border-primary hover:text-primary [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary rounded border px-3 py-1.5 font-mono transition-colors"
          >
            Carteiras (Privada)
          </Link>
          <a
            href="/rota-inexistente-teste"
            className="border-border bg-surface-card text-tiny text-coral hover:border-coral [&.active]:border-coral rounded border px-3 py-1.5 font-mono transition-colors"
          >
            404 (Rota Inexistente)
          </a>
        </div>
      </section>
    </div>
  );
}
