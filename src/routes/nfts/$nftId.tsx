import { AppFooter } from "@/components/layout/app-footer";
import { nfts } from "@/data/nfts";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/nfts/$nftId")({
  component: NFTDetailsPage,
});

function NFTDetailsPage() {
  const { nftId } = Route.useParams();
  const nft = nfts.find((item) => item.id === nftId);

  if (!nft) {
    return (
      <>
        <main className="mx-auto min-h-[60vh] max-w-[1440px] px-5 py-16 lg:px-10">
          <div className="rounded-card border border-border bg-surface p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              NFT não encontrado
            </h1>
            <p className="mt-3 text-sm text-muted">
              Não encontramos uma obra com esse identificador.
            </p>
            <Link
              to="/market"
              className="mt-6 inline-flex rounded-control bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover"
            >
              Voltar ao mercado
            </Link>
          </div>
        </main>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-[60vh] max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14">
        <Link
          to="/market"
          className="inline-flex text-sm text-muted transition-colors hover:text-primary"
        >
          ← Voltar ao mercado
        </Link>

        <section className="mt-8 grid items-start gap-8 md:grid-cols-2 md:gap-12">
          <div className="overflow-hidden rounded-card bg-surface">
            <img
              src={nft.image}
              alt={nft.name}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div className="py-2">
            <p className="text-sm font-semibold text-primary">
              {nft.collection}
            </p>

            <h1 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
              {nft.name}
            </h1>

            <p className="mt-4 text-sm leading-7 text-muted">
              Obra digital da coleção {nft.collection}, disponível no
              marketplace Kurio.
            </p>

            <div className="mt-8 rounded-card border border-border bg-surface p-5">
              <p className="text-sm text-muted">Preço atual</p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {nft.price.toFixed(2)} ETH
              </p>
              <p className="mt-2 text-sm text-muted">Rede: {nft.network}</p>

              <button
                type="button"
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-control bg-primary px-5 py-3 text-sm font-bold text-primary-foreground opacity-60"
                title="O carrinho será implementado na próxima etapa"
              >
                Adicionar ao carrinho
              </button>

              <p className="mt-3 text-center text-xs text-muted">
                Compra simulada — carrinho ainda não implementado.
              </p>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </>
  );
}
