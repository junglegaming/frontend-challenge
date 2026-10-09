import { Link } from '@tanstack/react-router';

const articles = [
  [
    'golden-frequency-071',
    'Como funciona a propriedade de NFTs',
    'Aprenda a colecionar, negociar e verificar ativos digitais.',
  ],
  [
    'golden-signal-160',
    '10 artistas digitais para acompanhar',
    'Conheça criadores que moldam a cultura digital.',
  ],
  [
    'sage-nomad-009',
    'Raridade, atributos e procedência',
    'Entenda raridade, procedência, direitos autorais e utilidade.',
  ],
  [
    'violet-nomad-314',
    'Como proteger sua carteira',
    'Proteja sua carteira, seus ativos e sua identidade.',
  ],
];

export function CatalogDiary() {
  return (
    <section id="diario" className="mt-24">
      <h2 className="text-h2 mb-3 text-center">Diário da Cunhagem</h2>
      <p className="text-body-sm text-secondary mb-10 text-center">
        Histórias, guias e insights para colecionadores sobre o universo da
        propriedade digital.
      </p>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {articles.map(([image, title, description], index) => (
          <article
            key={title}
            className="bg-surface-card overflow-hidden rounded-md"
          >
            <img
              src={`/assets/nft/${image}.png`}
              alt="NFT Image"
              className="h-48.75 w-full object-cover"
              width={268}
              height={195}
              loading="lazy"
            />
            <div className="px-4 py-3">
              <p className="text-tiny text-secondary font-medium">
                {[12, 13, 15, 15][index]} de setembro | Leitura de{' '}
                {[6, 2, 3, 2][index]} min
              </p>
              <h3 className="text-body-lg-bold">{title}</h3>
              <p className="text-tiny text-text-secondary font-medium">
                {description}
              </p>
              {/* @ts-expect-error TODO: Verificar para onde vai esse link */}
              <Link
                to="/"
                aria-disabled="true"
                className="text-caption-bold text-text-accent"
              >
                Ler mais →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
