import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Suas compras</p>
        <h1>Carrinho</h1>

        <div className="empty-state">
          <h2>Seu carrinho está vazio</h2>
          <p>Explore o mercado e encontre uma obra para sua coleção.</p>

          <Link to="/market" className="button">
            Explorar NFTs
          </Link>
        </div>
      </section>
    </main>
  );
}
