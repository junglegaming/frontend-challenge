export function CartSkeleton({ summary = false }: { summary?: boolean }) {
  return (
    <div
      role="status"
      aria-label={summary ? 'Carregando resumo' : 'Carregando carrinho'}
      aria-busy="true"
    >
      {summary ? 'Carregando resumo…' : 'Carregando itens do carrinho…'}
    </div>
  );
}
