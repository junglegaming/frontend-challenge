import { createFileRoute } from '@tanstack/react-router';
import { RoutePlaceholder } from '@/components/shared/RoutePlaceholder';
import { TokensDemo } from '@/components/TokensDemo';

export const Route = createFileRoute('/tokens')({
  component: TokensPage,
});

function TokensPage() {
  return (
    <RoutePlaceholder
      title="Design Tokens"
      frames="11:1278 (desktop) / 16:360 (mobile)"
      access="pública"
      description="Exemplo de design Tokens"
    >
      <TokensDemo />
    </RoutePlaceholder>
  );
}
