import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Nft } from '@/types/api';
import { NftRecommendationsSection } from '@/components/shared/NftRecommendationsSection';
import { collectionOptions } from '../queries';

export default function NftDesktopSections({
  nft,
  userId,
}: {
  nft: Nft;
  userId?: string;
}) {
  const [tab, setTab] = useState<'details' | 'reviews'>('details');
  const recommendations = useQuery(collectionOptions(nft.collection, userId));
  const related =
    recommendations.data?.items.filter(
      (item) => item.id !== nft.id && item.collection === nft.collection
    ) ?? [];
  return (
    <div className="mt-24 space-y-24">
      <section aria-label="Mais informações">
        <div
          role="tablist"
          aria-label="Detalhes e avaliações"
          className="border-border mb-3 flex gap-8 border-b"
        >
          {(['details', 'reviews'] as const)
            .filter((id) => id === 'details' || !!nft.reviews)
            .map((id) => (
              <button
                key={id}
                type="button"
                id={`tab-${id}`}
                role="tab"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(event) => {
                  if (
                    nft.reviews &&
                    ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                      event.key
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === 'Home'
                        ? 'details'
                        : event.key === 'End'
                          ? 'reviews'
                          : id === 'details'
                            ? 'reviews'
                            : 'details';
                    setTab(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }
                }}
                className={`text-body-17-bold pb-2 ${tab === id ? 'border-primary text-text-accent border-b-2 font-bold' : 'text-foreground'}`}
              >
                {id === 'details'
                  ? 'Detalhes do NFT'
                  : `Avaliações de colecionadores (${nft.reviews?.count})`}
              </button>
            ))}
        </div>
        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className="text-text-secondary space-y-4 text-sm leading-6"
        >
          {tab === 'details' ? (
            <>
              {(nft.details ?? nft.description)
                .split('\n')
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              <p>
                <strong className="text-foreground">Rede:</strong>
                <br />
                {nft.network}
              </p>
              {nft.contract && (
                <>
                  <p>
                    <strong className="text-foreground">Contrato:</strong>
                    <br />
                    Direitos autorais do criador: {nft.contract.royalties}% nas
                    vendas secundárias.
                  </p>
                  <p className="break-all">
                    {nft.contract.address} · {nft.contract.standard}
                    {nft.contract.verified && ' verificado'}
                  </p>
                </>
              )}
            </>
          ) : nft.reviews?.items.length ? (
            nft.reviews.items.map((review) => (
              <article key={review.id} className="border-border border-b pb-4">
                <p className="text-foreground font-bold">
                  {review.author} · {review.rating}/5
                </p>
                <p>{review.comment}</p>
                <time dateTime={review.date}>
                  {new Date(review.date).toLocaleDateString('pt-BR')}
                </time>
              </article>
            ))
          ) : (
            <p>Nenhuma avaliação disponível ainda.</p>
          )}
        </div>
      </section>
      <NftRecommendationsSection
        title="Mais desta coleção"
        items={related}
        isPending={recommendations.isPending}
        isError={recommendations.isError}
        onRetry={() => void recommendations.refetch()}
        errorMessage="Não foi possível carregar a coleção"
        emptyMessage="Nenhum outro NFT desta coleção disponível."
      />
    </div>
  );
}
