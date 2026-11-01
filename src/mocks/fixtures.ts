import type { Edition, Nft, NftReviews, Wallet } from '@/shared/contracts'

import { type UserRecord, hashPassword } from './db'

/**
 * Fixtures determinísticas: 2 usuários e um catálogo variado (coleções, redes,
 * faixas de preço e edições) para exercitar filtros e paginação.
 */

export function createUserRecords(): UserRecord[] {
  const pass = hashPassword('kurio123')
  return [
    {
      id: 'u-nova',
      name: 'Nova Sato',
      email: 'nova@kurio.test',
      passwordHash: pass,
      avatarUrl: null,
    },
    {
      id: 'u-bruno',
      name: 'Bruno Lima',
      email: 'bruno@kurio.test',
      passwordHash: pass,
      avatarUrl: null,
    },
  ]
}

export function seedWallets(): Record<string, Wallet[]> {
  return {
    'u-nova': [
      {
        id: 'w-1',
        address: '0x7aB8c41E2d9F0b3A5c6D7e8F9a0B1c2D3e4F9f3D',
        network: 'Polygon',
        label: 'Principal',
        isPrimary: true,
        provider: 'coinbase',
        ensName: 'nova.eth',
        referralCode: 'KURIO2026',
      },
      {
        id: 'w-2',
        address: '0x3cA1f09B8e7D6c5B4a3F2e1D0c9B8a7F6e5D0eB4',
        network: 'Ethereum',
        label: 'Reserva',
        isPrimary: false,
        provider: 'metamask',
        ensName: null,
        referralCode: null,
      },
    ],
    'u-bruno': [],
  }
}

/** Coleções do catálogo, na ordem do Figma (sidebar "Coleções"). */
export const COLLECTIONS = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const

/** Atributos e contrato por coleção; o NFT pode sobrescrever os atributos. */
const COLLECTION_DETAILS: Record<string, { attributes: string[]; contractAddress: string }> = {
  'Arte digital': { attributes: ['Óculos', 'Jaqueta', 'Raro'], contractAddress: '0x7A42…19E8' },
  Fotografia: { attributes: ['Luz natural', 'Retrato'], contractAddress: '0x3D90…B71C' },
  Música: { attributes: ['Faixa inédita', 'Áudio sem perdas'], contractAddress: '0x8F21…0A4E' },
  'Arte 3D': { attributes: ['Escultura', 'Render 4K'], contractAddress: '0x5E17…A0C6' },
  Colecionáveis: { attributes: ['Gênese', 'Edição limitada'], contractAddress: '0x91C3…4D2A' },
  Generativa: { attributes: ['Algorítmica', 'Seed única'], contractAddress: '0x6B04…E19F' },
  Jogos: { attributes: ['Item de jogo', 'Utilizável'], contractAddress: '0xC2A8…5D60' },
  Assinaturas: { attributes: ['Acesso mensal', 'Benefícios'], contractAddress: '0x2B8F…7E31' },
  Utilidade: { attributes: ['Ingresso', 'Resgatável'], contractAddress: '0x4E7D…93B2' },
}

const ATTRIBUTE_OVERRIDES: Record<string, string[]> = {
  'nft-1': ['Óculos', 'Esmeralda', 'Raro'],
}

function nft(
  id: string,
  name: string,
  collection: string,
  network: Nft['network'],
  priceEth: string,
  editions: Nft['editions'],
  imageUrl = '/images/NFT-Artwork-05.webp',
): Nft {
  return {
    id,
    name,
    description: `Um colecionável digital finalizado à mão da coleção ${collection}, verificado na ${network}.`,
    collection,
    network,
    priceEth,
    imageUrl,
    creator: { name: 'Nova Sato', address: 'nova.kurio.eth' },
    editions,
    attributes: ATTRIBUTE_OVERRIDES[id] ?? COLLECTION_DETAILS[collection]?.attributes ?? [],
    contractAddress: COLLECTION_DETAILS[collection]?.contractAddress ?? '0x0000…0000',
    version: 1,
  }
}

export function createNfts(): Nft[] {
  /**
   * Todo NFT oferece as faixas 1/1, 1/10, 1/50 e ABERTA, com estoque próprio
   * (determinístico por `n`, incluindo faixas esgotadas). A edição principal
   * vem primeiro e é a selecionada por padrão no detalhe.
   */
  const withTiers = (n: number, primary: Edition): Nft['editions'] => {
    const tiers: Edition[] = [
      { id: `${n}-1of1`, name: '1/1', totalSupply: 1, available: n % 3 === 0 ? 1 : 0 },
      { id: `${n}-1of10`, name: '1/10', totalSupply: 10, available: n % 4 },
      { id: `${n}-1of50`, name: '1/50', totalSupply: 50, available: (n * 7) % 50 },
      { id: `${n}-open`, name: 'ABERTA', totalSupply: null, available: 999 },
    ]
    return [primary, ...tiers.filter((tier) => tier.name !== primary.name)]
  }
  const open = (n: number): Nft['editions'] =>
    withTiers(n, { id: `${n}-open`, name: 'ABERTA', totalSupply: null, available: 999 })
  const limited = (n: number, supply: number, available?: number): Nft['editions'] =>
    withTiers(n, {
      id: `${n}-1`,
      name: `1/${supply}`,
      totalSupply: supply,
      available: available ?? supply,
    })

  return [
    nft(
      'nft-1',
      'Emerald Ape #042',
      'Arte digital',
      'Polygon',
      '1.19',
      limited(1, 50, 18),
      '/images/Frame-136.webp',
    ),
    nft('nft-2', 'Genesis Drop #001', 'Colecionáveis', 'Ethereum', '4.2', limited(2, 10, 3)),
    nft('nft-3', 'Crimson Ape #007', 'Arte digital', 'Polygon', '0.85', limited(3, 50, 50)),
    nft(
      'nft-4',
      'Solace in Motion',
      'Música',
      'Ethereum',
      '2.75',
      limited(4, 1, 1),
      '/images/NFT-Artwork-09.webp',
    ),
    nft('nft-5', 'Neon Drift #12', 'Generativa', 'Polygon', '0.49', open(5)),
    nft(
      'nft-6',
      'Aurora Fragment',
      'Jogos',
      'Ethereum',
      '6.5',
      limited(6, 1, 0),
      '/images/NFT-Artwork-18.webp',
    ),
    nft('nft-7', 'Golden Ape #003', 'Arte digital', 'Ethereum', '3.1', limited(7, 50, 27)),
    nft('nft-8', 'Genesis Drop #008', 'Colecionáveis', 'Polygon', '1.9', limited(8, 10, 8)),
    nft('nft-9', 'Static Bloom', 'Arte 3D', 'Ethereum', '0.99', open(9)),
    nft('nft-10', 'Iron Ape #019', 'Arte digital', 'Polygon', '1.45', limited(10, 50, 41)),
    nft('nft-11', 'Void Garden', 'Assinaturas', 'Polygon', '0.68', limited(11, 100, 100)),
    nft('nft-12', 'Genesis Drop #013', 'Colecionáveis', 'Ethereum', '5.0', limited(12, 10, 1)),
    nft('nft-13', 'Chromatic Wave', 'Fotografia', 'Polygon', '0.27', open(13)),
    nft('nft-14', 'Obsidian Ape #051', 'Arte digital', 'Ethereum', '2.25', limited(14, 50, 6)),
    nft(
      'nft-15',
      'Lumen Codex',
      'Utilidade',
      'Ethereum',
      '8.0',
      limited(15, 1, 1),
      '/images/NFT-Artwork-09.webp',
    ),
    nft('nft-16', 'Genesis Drop #021', 'Colecionáveis', 'Polygon', '0.75', limited(16, 10, 10)),
    nft(
      'nft-17',
      'Sage Nomad #009',
      'Arte digital',
      'Polygon',
      '1.69',
      limited(17, 50, 12),
      '/images/NFT-Artwork-09.webp',
    ),
    nft(
      'nft-18',
      'Neon Vessel #552',
      'Generativa',
      'Ethereum',
      '1.99',
      limited(18, 50, 25),
      '/images/NFT-Artwork-18.webp',
    ),
    nft(
      'nft-19',
      'Cosmic Bloom #118',
      'Música',
      'Polygon',
      '1.29',
      limited(19, 50, 30),
      '/images/NFT-Artwork-18.webp',
    ),
    nft(
      'nft-20',
      'Violet Nomad #314',
      'Arte digital',
      'Ethereum',
      '1.39',
      limited(20, 50, 45),
      '/images/NFT-Artwork-18.webp',
    ),
    nft(
      'nft-21',
      'Ivory Baron #088',
      'Arte 3D',
      'Polygon',
      '1.79',
      limited(21, 50, 8),
      '/images/NFT-Artwork-05.webp',
    ),
    nft(
      'nft-22',
      'Golden Beat #207',
      'Jogos',
      'Ethereum',
      '0.99',
      limited(22, 50, 19),
      '/images/NFT-Artwork-09.webp',
    ),
    nft(
      'nft-23',
      'Golden Signal #160',
      'Arte digital',
      'Polygon',
      '0.39',
      limited(23, 50, 22),
      '/images/NFT-Artwork-09.webp',
    ),
    nft('nft-24', 'Cyber Relic #004', 'Colecionáveis', 'Ethereum', '3.8', limited(24, 10, 2)),
    nft('nft-25', 'Astral Mirage #077', 'Arte digital', 'Polygon', '1.15', limited(25, 50, 14)),
    nft('nft-26', 'Quantum Echo', 'Fotografia', 'Ethereum', '2.45', open(26)),
    nft('nft-27', 'Solaris Flux #012', 'Assinaturas', 'Polygon', '0.88', limited(27, 100, 72)),
    nft('nft-28', 'Prism Monarch #033', 'Arte digital', 'Ethereum', '4.10', limited(28, 50, 5)),
    nft('nft-29', 'Ethereal Drift', 'Colecionáveis', 'Polygon', '1.55', limited(29, 10, 4)),
    nft('nft-30', 'Glitch Horizon #101', 'Generativa', 'Ethereum', '0.62', open(30)),
    nft('nft-31', 'Nexus Core #055', 'Utilidade', 'Polygon', '1.80', limited(31, 50, 31)),
    nft('nft-32', 'Phantom Bloom #220', 'Arte digital', 'Ethereum', '2.90', limited(32, 50, 9)),
    nft('nft-33', 'Vapor Wave #018', 'Arte 3D', 'Polygon', '0.45', open(33)),
    nft('nft-34', 'Apex Nomad #040', 'Arte digital', 'Ethereum', '3.25', limited(34, 50, 16)),
    nft('nft-35', 'Aura Pulse #080', 'Música', 'Polygon', '1.05', limited(35, 100, 85)),
    nft('nft-36', 'Genesis Relic #009', 'Colecionáveis', 'Ethereum', '6.0', limited(36, 10, 1)),
    nft('nft-37', 'Zero Gravity #002', 'Fotografia', 'Polygon', '0.78', open(37)),
    nft('nft-38', 'Cyber Nomad #144', 'Arte digital', 'Ethereum', '2.10', limited(38, 50, 21)),
    nft('nft-39', 'Nova Bloom #303', 'Jogos', 'Polygon', '1.35', limited(39, 50, 40)),
    nft('nft-40', 'Obsidian Core #062', 'Colecionáveis', 'Ethereum', '4.8', limited(40, 10, 3)),
    nft('nft-41', 'Pulse Matrix #015', 'Generativa', 'Polygon', '0.52', open(41)),
    nft('nft-42', 'Hyper Ape #099', 'Arte digital', 'Ethereum', '3.75', limited(42, 50, 7)),
    nft('nft-43', 'Mirage Drift #024', 'Assinaturas', 'Polygon', '0.95', limited(43, 100, 60)),
    nft('nft-44', 'Genesis Artifact #011', 'Colecionáveis', 'Ethereum', '5.2', limited(44, 10, 2)),
    nft('nft-45', 'Echo Horizon #008', 'Arte 3D', 'Polygon', '0.38', open(45)),
    nft('nft-46', 'Titan Ape #070', 'Arte digital', 'Ethereum', '2.65', limited(46, 50, 18)),
    nft('nft-47', 'Zenith Pulse #110', 'Utilidade', 'Polygon', '1.50', limited(47, 50, 33)),
    nft('nft-48', 'Genesis Void #025', 'Colecionáveis', 'Ethereum', '7.2', limited(48, 10, 1)),
  ]
}

const REVIEW_POOL: NftReviews['items'] = [
  {
    id: 'rv-1',
    author: 'Kaelen Vance',
    rating: 5,
    createdAt: '2026-10-28T14:00:00.000Z',
    comment:
      'A qualidade da arte em alta resolução é impressionante. Transação na rede confirmada rapidamente e procedência impecável.',
  },
  {
    id: 'rv-2',
    author: 'Elena Rostova',
    rating: 5,
    createdAt: '2026-10-25T10:30:00.000Z',
    comment:
      'Uma das melhores peças da coleção. A iluminação e os detalhes são obras-primas do artista.',
  },
  {
    id: 'rv-3',
    author: 'Lucas Mendes',
    rating: 5,
    createdAt: '2026-10-21T18:15:00.000Z',
    comment:
      'Excelente projeto. Curadoria impecável e metadados totalmente acessíveis no IPFS. Super recomendo!',
  },
  {
    id: 'rv-4',
    author: 'Sofia Chen',
    rating: 4,
    createdAt: '2026-10-18T09:45:00.000Z',
    comment: 'Arte espetacular. O contrato verificado dá muita tranquilidade aos colecionadores.',
  },
]

/**
 * Avaliações determinísticas por NFT: resumo agregado (média e total) e as
 * quatro mais recentes.
 *
 * @param nftId - Id do NFT.
 * @returns Resumo e itens no formato do contrato.
 */
export function reviewsFor(nftId: string): NftReviews {
  const n = Number(nftId.replace(/\D/g, '')) || 1
  const averages = ['4.8', '4.6', '4.9', '4.7', '4.5'] as const
  return {
    average: averages[(n - 1) % averages.length] ?? '4.8',
    count: n === 1 ? 19 : 6 + ((n * 5) % 30),
    items: REVIEW_POOL,
  }
}
