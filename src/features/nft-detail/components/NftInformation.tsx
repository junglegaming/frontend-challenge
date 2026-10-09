import Star from '@/assets/nft-detail/star.svg?react';
import PartialStar from '@/assets/nft-detail/star-partial.svg?react';
import Mail from '@/assets/nft-detail/message.svg?react';
import type { ReactNode } from 'react';
import type { Nft } from '@/types/api';
import { Price } from '@/components/shared/Price';
import Linkedin from '@/assets/linkedin.svg?react';
import Twitter from '@/assets/twitter.svg?react';

export function NftInformation({
  nft,
  children,
}: {
  nft: Nft;
  children: ReactNode;
}) {
  const edition = `${nft.edition.current}/${nft.edition.total}`;
  const editions = [...new Set(['1/1', '1/10', '1/50', 'ABERTA', edition])];
  const shareUrl =
    window.location.origin + `/nfts/${encodeURIComponent(nft.id)}`;

  return (
    <section
      aria-label="Informações do NFT"
      className="bg-surface-card relative -mt-7 flex min-w-0 flex-col gap-5 rounded-t-4xl px-6 pt-8 pb-12 md:m-0 md:justify-between md:gap-2 md:rounded-none md:bg-transparent md:p-0"
    >
      <div className="md:border-border md:border-b md:pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-title md:text-h1">{nft.name}</h1>
          {nft.reviews && (
            <span className="border-primary text-text-secondary inline-flex items-center gap-1 rounded-full border px-1.5 py-1 text-sm md:hidden">
              <Star className="text-primary size-3.5" fill="currentColor" />
              {nft.reviews.average} ({nft.reviews.count})
            </span>
          )}
        </div>
        <div className="mt-3 hidden flex-wrap items-center justify-between gap-3 md:flex">
          <p className="text-[22px] leading-4 font-bold">
            <Price value={nft.price} previousPrice={nft.previousPrice} />
          </p>
          {nft.reviews && (
            <div className="text-body flex items-center gap-1">
              <span
                className="text-primary flex"
                aria-label={`Nota ${nft.reviews.average} de 5`}
              >
                {Array.from({ length: 5 }, (_, i) =>
                  i < Math.floor(nft.reviews!.average) ? (
                    <Star key={i} aria-hidden="true" className="size-3.75" />
                  ) : (
                    <PartialStar
                      key={i}
                      aria-hidden="true"
                      className="size-3.75"
                    />
                  )
                )}
              </span>
              <span>{nft.reviews.count} avaliações de colecionadores</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-body mb-3 hidden leading-4 font-bold md:block">
          Sobre este NFT:
        </h2>
        <p className="text-text-secondary text-sm leading-6">
          {nft.description}
        </p>
      </div>
      <div>
        <h2 className="text-body mb-3 leading-4 font-bold">Edição:</h2>
        <p id="edition-availability" className="sr-only">
          Apenas a edição {edition} está disponível para este NFT. As outras
          opções de edição estão desativadas.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {editions.map((label) => (
            <button
              type="button"
              key={label}
              disabled={label !== edition || !nft.editable}
              aria-pressed={label === edition}
              aria-describedby="edition-availability"
              title={
                label !== edition
                  ? 'Edição indisponível para este NFT'
                  : undefined
              }
              className={`rounded-full border px-1.5 py-1 text-sm leading-4 ${label === edition ? 'border-primary text-text-accent' : 'border-border text-text-secondary'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {!nft.editable && (
          <p
            id="purchase-unavailable"
            role="status"
            className="text-coral mt-3 text-sm"
          >
            Edição indisponível. A compra desta edição está desativada.
          </p>
        )}
        {nft.available === 0 && (
          <p
            id="purchase-stock"
            role="status"
            className="text-coral mt-3 text-sm"
          >
            Esgotado. Não há exemplares disponíveis.
          </p>
        )}
      </div>
      {children}
      <div className="text-secondary text-body space-y-3 wrap-break-word">
        {nft.tokenId && <p>ID do token: #{nft.tokenId}</p>}
        <p>Coleção: {nft.collection}</p>
        <p>Criador: {nft.creator.name}</p>
        {!!nft.attributes?.length && (
          <p>
            Atributos:{' '}
            {nft.attributes.map((attribute) => attribute.value).join(', ')}
          </p>
        )}
        <div className="text-foreground hidden flex-wrap items-center gap-2 md:flex">
          <span className="leading-4 font-bold">Compartilhar este NFT:</span>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Compartilhar no LinkedIn"
          >
            <Linkedin className="size-4" />
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(shareUrl)}`}
            aria-label="Compartilhar por e-mail"
          >
            <Mail className="size-4" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(nft.name)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Compartilhar no Twitter"
          >
            <Twitter className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
