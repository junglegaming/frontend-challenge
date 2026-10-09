import { lazy, Suspense } from 'react';
import { getRouteApi, Link } from '@tanstack/react-router';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { ErrorState } from '@/components/shared/ErrorState';
import { useNftDetail } from '../hooks/useNftDetail';
import { NftDetailSkeleton } from './NftDetailSkeleton';
import { NftGallery } from './NftGallery';
import { NftInformation } from './NftInformation';
import { PurchaseControls } from './PurchaseControls';

const DesktopSections = lazy(() => import('./NftDesktopSections'));
const route = getRouteApi('/nfts/$nftId');
export function NftDetailPage() {
  const { nftId } = route.useParams();
  return <NftDetailContent key={nftId} />;
}
function NftDetailContent() {
  const controller = useNftDetail();
  const desktop = useMediaQuery('(min-width: 768px)');
  const { query } = controller;
  if (query.isPending) return <NftDetailSkeleton />;
  if (query.isError) {
    const missing = 'status' in query.error && query.error.status === 404;
    return (
      <div className="p-6 md:p-0">
        {missing ? (
          <section className="border-border my-8 rounded-xl border p-8 text-center">
            <h1 className="text-h1">NFT não encontrado</h1>
            <p className="text-text-secondary my-4">
              Este NFT não existe ou deixou de estar disponível.
            </p>
            <Link
              to="/"
              search={{ sort: 'relevance', page: 1 }}
              className="text-text-accent underline"
            >
              Voltar ao catálogo
            </Link>
          </section>
        ) : (
          <ErrorState
            title="Não foi possível carregar o NFT"
            onRetry={() => void query.refetch()}
          />
        )}
      </div>
    );
  }
  const nft = query.data;
  return (
    <div className="bg-surface-card min-h-dvh pb-48 md:min-h-0 md:bg-transparent md:pb-0">
      <nav
        aria-label="Caminho de navegação"
        className="text-body mb-3 hidden font-bold md:block"
      >
        <Link to="/" search={{ sort: 'relevance', page: 1 }}>
          Início / Mercado
        </Link>
      </nav>
      <div className="grid md:gap-8.25 xl:grid-cols-[572px_minmax(0,1fr)]">
        <NftGallery
          key={nft.id}
          nft={nft}
          selected={controller.selected}
          pending={controller.favoritePending}
          onFavorite={controller.onFavorite}
        />
        <NftInformation nft={nft}>
          <PurchaseControls nft={nft} controller={controller} />
        </NftInformation>
      </div>
      {controller.favorites.isError && (
        <div className="px-6 md:px-0">
          <ErrorState
            variant="compact"
            title="Não foi possível carregar os favoritos"
            onRetry={() => void controller.favorites.refetch()}
          />
        </div>
      )}
      <p
        role="status"
        aria-live="polite"
        className="text-text-secondary px-6 py-2 text-sm md:px-0"
      >
        {controller.feedback}
      </p>
      <span role="status" className="sr-only">
        Quantidade selecionada: {controller.quantity}. Estoque disponível:{' '}
        {controller.available}. {nft.price} ETH.{' '}
        {controller.selected ? 'NFT favoritado' : 'NFT fora dos favoritos'}.
      </span>
      {!desktop && (
        <PurchaseControls nft={nft} controller={controller} mobile />
      )}
      {desktop && (
        <Suspense
          fallback={<p role="status">Carregando informações da coleção…</p>}
        >
          <DesktopSections key={nft.id} nft={nft} userId={controller.userId} />
        </Suspense>
      )}
    </div>
  );
}
