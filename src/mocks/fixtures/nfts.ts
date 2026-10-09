import type { Nft, Rarity } from '@/lib/http/schemas';
import { percentOf } from '@/lib/money';

export const NFT_CATEGORIES: readonly string[] = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Utilidade',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
];

export const NFT_IMAGES: readonly string[] = [
  '/assets/nft/golden-signal-160.png',
  '/assets/nft/sage-nomad-009.png',
  '/assets/nft/golden-frequency-071.png',
  '/assets/nft/violet-nomad-314.png',
];

type HeroDef = {
  slug: string;
  num: number;
  price: string;
  available?: number;
};

const HEROES: readonly HeroDef[] = [
  { slug: 'golden-signal', num: 160, price: '0.99', available: 8 },
  { slug: 'sage-nomad', num: 9, price: '0.02' },
  { slug: 'golden-frequency', num: 71, price: '0.02' },
  { slug: 'violet-nomad', num: 314, price: '0.02' },
  { slug: 'golden-beat', num: 207, price: '0.02' },
  { slug: 'crimson-echo', num: 451, price: '12.30' },
];

const GENERATED_SLUGS: readonly string[] = [
  'amber-drift',
  'cobalt-wave',
  'ember-ridge',
  'solar-harbor',
  'lunar-bloom',
  'coral-depth',
  'onyx-garden',
  'ivory-signal',
  'teal-motion',
  'ruby-circuit',
  'mint-lagoon',
  'slate-echo',
  'pearl-vista',
  'copper-rush',
  'indigo-fable',
  'jade-orbit',
  'crimson-tide',
  'bronze-pulse',
];

const PRICES: readonly string[] = [
  '0.02',
  '0.06',
  '0.11',
  '0.18',
  '0.27',
  '0.45',
  '0.72',
  '1.10',
  '1.85',
  '2.40',
  '3.60',
  '6.50',
  '12.30',
];

const EDITION_TOTALS: readonly number[] = [1, 10, 25, 50, 100];

const SOLD_OUT = new Set([11, 34, 57]);

const NOT_EDITABLE = new Set([7, 19, 46]);

const CREATORS: readonly { id: string; name: string }[] = [
  { id: 'cr_kurio_studio', name: 'Kurio Studio' },
  { id: 'cr_kurio_lab', name: 'Kurio Lab' },
];

const BACKDROPS: readonly string[] = ['Âmbar', 'Cobalto', 'Coral', 'Violeta'];

const STROKES: readonly string[] = [
  'Nítido',
  'Granulado',
  'Fluido',
  'Geométrico',
];

const BASE_TIME = Date.UTC(2026, 7, 1, 12, 0, 0);

const DAY_MS = 86_400_000;

const pad = (n: number): string => String(n).padStart(3, '0');

const titleCase = (slug: string): string =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const categoriesAt = (i: number): string[] => {
  const picked = [NFT_CATEGORIES[i % 5], NFT_CATEGORIES[Math.floor(i / 5) % 5]];
  if (i % 7 === 0) picked.push(NFT_CATEGORIES[(i + 3) % 5]);
  if (i >= 6) picked.push(NFT_CATEGORIES[5 + (i % 4)]);
  return picked.filter((value, index) => picked.indexOf(value) === index);
};

const isoAt = (i: number): string =>
  new Date(BASE_TIME + i * DAY_MS).toISOString();

const REVIEW_PAIRS = [
  [5, 4],
  [5, 5],
  [3, 4],
  [1, 2],
  [0, 1],
] as const;

const reviewsAt = (i: number, nftId: string): Nft['reviews'] => {
  // Keep both optional metadata and the explicit empty state testable.
  if (i % 10 === 8) return undefined;
  if (i % 10 === 9) return { average: 0, count: 0, items: [] };
  const ratings = REVIEW_PAIRS[i % REVIEW_PAIRS.length];
  return {
    average: (ratings[0] + ratings[1]) / 2,
    count: ratings.length,
    items: ratings.map((rating, index) => ({
      id: `review-${nftId}-${index + 1}`,
      author: index === 0 ? 'Ana Costa' : 'Bruno Lima',
      rating,
      comment:
        rating >= 4
          ? 'Arte com ótimos detalhes para minha coleção.'
          : rating >= 2
            ? 'Uma edição interessante, mas esperava mais detalhes na arte.'
            : 'A arte não correspondeu às minhas expectativas.',
      date: isoAt(i + index + 1),
    })),
  };
};

const buildNft = (i: number): Nft => {
  const hero = HEROES[i];
  const slug = hero ? hero.slug : GENERATED_SLUGS[i % GENERATED_SLUGS.length];
  const num = hero ? hero.num : i;
  const id = hero ? `${slug}-${pad(num)}` : `kurio-${slug}-${pad(num)}`;
  const name = `${titleCase(slug)} #${pad(num)}`;
  const collection = i % 2 === 0 ? 'Kurio Editions' : 'Kurio Apes';
  const creator = CREATORS[i % 2];
  const total = EDITION_TOTALS[(i + 1) % EDITION_TOTALS.length];
  const current = 1 + (i % total);
  const price = hero ? hero.price : PRICES[(i * 7) % PRICES.length];
  const stock = Math.min(total, 1 + (i % 10));
  const available = SOLD_OUT.has(i) ? 0 : (hero?.available ?? stock);
  const image = NFT_IMAGES[i % NFT_IMAGES.length];
  const iso = isoAt(i);
  const rarity: Rarity = total === 1 ? 'ÚNICO' : i % 7 === 0 ? 'RARO' : 'COMUM';
  return {
    id,
    name,
    collection,
    creator: { ...creator },
    edition: { current, total },
    price,
    ...(i % 6 === 0 ? { previousPrice: percentOf(price, 120) } : {}),
    categories: categoriesAt(i),
    network: (['ethereum', 'polygon', 'solana'] as const)[i % 3],
    image,
    images: [image, ...NFT_IMAGES.filter((entry) => entry !== image)],
    description: `${name} — exemplar ${current} de ${total} da coleção ${collection}.`,
    tokenId: String(num).padStart(4, '0'),
    details: `${name} é uma obra digital da coleção ${collection}. Cada atributo fica armazenado nos metadados do token.\nA propriedade inclui arte em alta resolução e acesso para colecionadores.`,
    editable: !NOT_EDITABLE.has(i),
    available,
    favoritesCount: (i * 7) % 130,
    reviews: reviewsAt(i, id),
    rarity,
    attributes: [
      { trait: 'Fundo', value: BACKDROPS[i % 4] },
      { trait: 'Traço', value: STROKES[(i * 3) % 4] },
    ],
    version: 1,
    updatedAt: iso,
    createdAt: iso,
  };
};

const buildNfts = (): Nft[] => [
  ...Array.from({ length: 64 }, (_, i) => buildNft(i)),
  {
    ...buildNft(0),
    id: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    tokenId: '0042',
    collection: 'Kurio Apes',
    image: '/assets/hero/mobile-artwork-main.png',
    images: ['/assets/hero/mobile-artwork-main.png', ...NFT_IMAGES.slice(0, 3)],
    edition: { current: 1, total: 50 },
    price: '1.19',
    previousPrice: undefined,
    available: 8,
    rarity: 'RARO',
    description:
      'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
    details:
      'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.\nA propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    creator: { id: 'cr_nova_sato', name: 'Nova Sato' },
    attributes: [
      { trait: 'Acessório', value: 'Óculos' },
      { trait: 'Cor', value: 'Esmeralda' },
      { trait: 'Raridade', value: 'Raro' },
    ],
    contract: {
      address: '0x7f420000000000000000000000000000000019C8',
      standard: 'ERC-721',
      verified: true,
      royalties: '5',
    },
    reviews: {
      average: 4.8,
      count: 19,
      items: [
        {
          id: 'review-emerald-1',
          author: 'Ana Costa',
          rating: 5,
          comment:
            'Arte cheia de detalhes e uma edição especial para minha coleção.',
          date: '2026-08-02T12:00:00.000Z',
        },
        {
          id: 'review-emerald-2',
          author: 'Bruno Lima',
          rating: 4,
          comment: 'Gostei das cores e da identidade desta coleção.',
          date: '2026-08-03T12:00:00.000Z',
        },
      ],
    },
  },
];

export const SEED_NFTS: Nft[] = buildNfts();

export const getSeedNft = (id: string): Nft => {
  const nft = SEED_NFTS.find((item) => item.id === id);
  if (!nft) throw new Error(`Fixture de NFT ausente: ${id}`);
  return nft;
};
