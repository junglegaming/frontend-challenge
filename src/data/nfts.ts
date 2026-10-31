export interface NFTReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export const NFT_EDITIONS = ["1/1", "1/10", "1/50", "Aberta"] as const;

export type NFTEdition = (typeof NFT_EDITIONS)[number];

export interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  price: number;
  originalPrice?: number;
  category: string;
  network: string;
  launch?: boolean;
  description: string;
  tokenId: string;
  edition: NFTEdition;
  attributes: string[];
  rating: number;
  reviewCount: number;
  reviews: NFTReview[];
  creator: string;
  contractAddress: string;
  creatorRoyalty: number;
  unlockableContent: boolean;
  ipfsMetadata: string;
}

type NFTSeed = Omit<
  NFT,
  | "description"
  | "rating"
  | "reviewCount"
  | "reviews"
  | "creator"
  | "contractAddress"
  | "creatorRoyalty"
  | "unlockableContent"
  | "ipfsMetadata"
>;

export const NFT_CATEGORIES = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Assinaturas",
  "Utilidade",
] as const;

export const NFT_NETWORKS = ["Ethereum", "Polygon", "Solana"] as const;

const categoryDescriptions: Record<string, string> = {
  "Arte digital":
    "Uma obra digital criada para explorar identidade, expressão e estética em um universo sem fronteiras.",
  Fotografia:
    "Uma fotografia digital que transforma momentos, paisagens e perspectivas em uma peça colecionável.",
  Música:
    "Uma criação sonora digital que conecta música, criatividade e colecionismo em uma experiência única.",
  "Arte 3D":
    "Uma obra tridimensional que combina formas, materiais e iluminação em uma composição visual marcante.",
  Colecionáveis:
    "Um colecionável digital com identidade própria, criado para colecionadores que valorizam peças especiais.",
  Generativa:
    "Uma obra que explora padrões, cores e composições por meio de conceitos de arte generativa.",
  Jogos:
    "Um ativo digital inspirado no universo dos jogos, das experiências interativas e das comunidades virtuais.",
  Assinaturas:
    "Um passe digital que representa uma experiência de associação, conteúdos ou benefícios para membros.",
  Utilidade:
    "Um ativo digital desenvolvido para representar acesso, benefícios ou funcionalidades em um ecossistema.",
};

const reviewComments = [
  "Arte muito bem produzida, com identidade visual marcante.",
  "Gostei dos detalhes e da proposta desta coleção.",
  "Uma peça interessante para quem gosta de colecionáveis digitais.",
];

const reviewAuthors = ["Colecionador 01", "Colecionador 02", "Colecionador 03"];

function createNFT(seed: NFTSeed, index: number): NFT {
  const reviews: NFTReview[] = reviewComments.map((comment, reviewIndex) => ({
    id: `${seed.id}-review-${reviewIndex + 1}`,
    author: reviewAuthors[reviewIndex],
    rating: reviewIndex === 1 ? 4 : 5,
    comment,
    date: ["2026-10-12", "2026-10-19", "2026-10-24"][reviewIndex],
  }));

  return {
    ...seed,
    description: categoryDescriptions[seed.category],
    rating: Number((4.2 + (index % 8) * 0.1).toFixed(1)),
    reviewCount: 19 + (index % 18),
    reviews,
    creator: "Kurio Editions",
    contractAddress: "",
    creatorRoyalty: 5,
    unlockableContent: true,
    ipfsMetadata: "",
  };
}

const nftSeeds: NFTSeed[] = [
  {
    id: "emerald-ape-042",
    name: "Emerald Ape #042",
    collection: "Kurio Apes",
    image: "/images/jungle-green.png",
    price: 1.19,
    category: "Arte digital",
    network: "Ethereum",
    launch: true,
    tokenId: "#0042",
    edition: "1/50",
    attributes: ["Óculos", "Esmeralda", "Raro"],
  },
  {
    id: "sage-nomad-009",
    name: "Sage Nomad #009",
    collection: "Nomad Society",
    image: "/images/jungle-violet.png",
    price: 2.69,
    category: "Colecionáveis",
    network: "Ethereum",
    launch: true,
    tokenId: "#0009",
    edition: "1/10",
    attributes: ["Chapéu", "Viajante", "Épico"],
  },
  {
    id: "neon-vessel-552",
    name: "Neon Vessel #552",
    collection: "Vessel Collection",
    image: "/images/jungle-gray.png",
    price: 3.99,
    originalPrice: 5.29,
    category: "Arte 3D",
    network: "Polygon",
    tokenId: "#0552",
    edition: "1/50",
    attributes: ["Cromado", "Neon", "Raro"],
  },
  {
    id: "cosmic-bloom-118",
    name: "Cosmic Bloom #118",
    collection: "Cosmic Collection",
    image: "/images/jungle-violet.png",
    price: 1.49,
    category: "Arte digital",
    network: "Ethereum",
    tokenId: "#0118",
    edition: "1/50",
    attributes: ["Cósmica", "Floral", "Incomum"],
  },
  {
    id: "violet-nomad-314",
    name: "Violet Nomad #314",
    collection: "Nomad Society",
    image: "/images/jungle-violet.png",
    price: 4.39,
    category: "Colecionáveis",
    network: "Solana",
    launch: true,
    tokenId: "#0314",
    edition: "1/50",
    attributes: ["Violeta", "Nômade", "Épico"],
  },
  {
    id: "ivory-baron-088",
    name: "Ivory Baron #088",
    collection: "Baron Collection",
    image: "/images/jungle-gray.png",
    price: 5.79,
    category: "Colecionáveis",
    network: "Solana",
    tokenId: "#0088",
    edition: "1/10",
    attributes: ["Terno", "Marfim", "Lendário"],
  },
  {
    id: "golden-beat-207",
    name: "Golden Beat #207",
    collection: "Golden Collection",
    image: "/images/jungle-orange.png",
    price: 1.99,
    category: "Música",
    network: "Polygon",
    launch: true,
    tokenId: "#0207",
    edition: "1/50",
    attributes: ["Eletrônico", "Golden Beat", "Raro"],
  },
  {
    id: "golden-signal-160",
    name: "Golden Signal #160",
    collection: "Golden Collection",
    image: "/images/jungle-orange.png",
    price: 2.29,
    category: "Arte digital",
    network: "Solana",
    tokenId: "#0160",
    edition: "Aberta",
    attributes: ["Dourado", "Sinal", "Incomum"],
  },
  {
    id: "pixel-dream-023",
    name: "Pixel Dream #023",
    collection: "Pixel Dreams",
    image: "/images/jungle-green.png",
    price: 3.49,
    category: "Jogos",
    network: "Polygon",
    launch: true,
    tokenId: "#0023",
    edition: "1/50",
    attributes: ["Pixel art", "Fantasia", "Raro"],
  },
  {
    id: "silent-mountain-101",
    name: "Silent Mountain #101",
    collection: "Nature Frames",
    image: "/images/jungle-gray.png",
    price: 6.45,
    category: "Fotografia",
    network: "Ethereum",
    tokenId: "#0101",
    edition: "1/10",
    attributes: ["Montanha", "Serena", "Épico"],
  },
  {
    id: "electric-wave-014",
    name: "Electric Wave #014",
    collection: "Sound Lab",
    image: "/images/jungle-violet.png",
    price: 2.75,
    category: "Música",
    network: "Solana",
    tokenId: "#0014",
    edition: "Aberta",
    attributes: ["Eletrônico", "Ondas", "Incomum"],
  },
  {
    id: "chrome-beast-302",
    name: "Chrome Beast #302",
    collection: "Chrome World",
    image: "/images/jungle-gray.png",
    price: 7.25,
    category: "Arte 3D",
    network: "Polygon",
    tokenId: "#0302",
    edition: "1/50",
    attributes: ["Cromo", "Criatura", "Épico"],
  },
  {
    id: "fluid-form-077",
    name: "Fluid Form #077",
    collection: "Generative Forms",
    image: "/images/jungle-violet.png",
    price: 5.89,
    category: "Generativa",
    network: "Ethereum",
    tokenId: "#0077",
    edition: "1/50",
    attributes: ["Fluida", "Violeta", "Raro"],
  },
  {
    id: "creator-pass-005",
    name: "Creator Pass #005",
    collection: "Creator Club",
    image: "/images/jungle-orange.png",
    price: 8.5,
    category: "Assinaturas",
    network: "Ethereum",
    tokenId: "#0005",
    edition: "1/10",
    attributes: ["Criadores", "Conteúdo exclusivo", "Lendário"],
  },
  {
    id: "access-key-021",
    name: "Access Key #021",
    collection: "Utility Keys",
    image: "/images/jungle-green.png",
    price: 1.55,
    category: "Utilidade",
    network: "Polygon",
    tokenId: "#0021",
    edition: "Aberta",
    attributes: ["Digital", "Chave", "Incomum"],
  },
  {
    id: "forest-guardian-018",
    name: "Forest Guardian #018",
    collection: "Wild Guardians",
    image: "/images/jungle-green.png",
    price: 4.15,
    category: "Colecionáveis",
    network: "Ethereum",
    launch: true,
    tokenId: "#0018",
    edition: "1/50",
    attributes: ["Floresta", "Guardião", "Raro"],
  },
  {
    id: "golden-hour-064",
    name: "Golden Hour #064",
    collection: "Nature Frames",
    image: "/images/jungle-orange.png",
    price: 3.85,
    category: "Fotografia",
    network: "Solana",
    tokenId: "#0064",
    edition: "Aberta",
    attributes: ["Golden hour", "Natureza", "Incomum"],
  },
  {
    id: "synth-orbit-039",
    name: "Synth Orbit #039",
    collection: "Sound Lab",
    image: "/images/jungle-violet.png",
    price: 2.05,
    category: "Música",
    network: "Polygon",
    tokenId: "#0039",
    edition: "1/50",
    attributes: ["Synthwave", "Espacial", "Raro"],
  },
  {
    id: "liquid-metal-126",
    name: "Liquid Metal #126",
    collection: "Chrome World",
    image: "/images/jungle-gray.png",
    price: 9.9,
    category: "Arte 3D",
    network: "Ethereum",
    launch: true,
    tokenId: "#0126",
    edition: "1/10",
    attributes: ["Metal líquido", "Reflexivo", "Lendário"],
  },
  {
    id: "fractal-garden-032",
    name: "Fractal Garden #032",
    collection: "Generative Forms",
    image: "/images/jungle-green.png",
    price: 6.35,
    category: "Generativa",
    network: "Solana",
    tokenId: "#0032",
    edition: "1/50",
    attributes: ["Fractal", "Jardim", "Raro"],
  },
  {
    id: "arcade-legend-011",
    name: "Arcade Legend #011",
    collection: "Pixel Dreams",
    image: "/images/jungle-orange.png",
    price: 4.45,
    category: "Jogos",
    network: "Polygon",
    tokenId: "#0011",
    edition: "1/50",
    attributes: ["Arcade", "Lenda", "Raro"],
  },
  {
    id: "artist-circle-008",
    name: "Artist Circle #008",
    collection: "Creator Club",
    image: "/images/jungle-violet.png",
    price: 10.2,
    category: "Assinaturas",
    network: "Ethereum",
    tokenId: "#0008",
    edition: "1/10",
    attributes: ["Artistas", "Acesso exclusivo", "Lendário"],
  },
  {
    id: "vip-access-044",
    name: "VIP Access #044",
    collection: "Utility Keys",
    image: "/images/jungle-gray.png",
    price: 2.65,
    category: "Utilidade",
    network: "Solana",
    tokenId: "#0044",
    edition: "Aberta",
    attributes: ["VIP", "Passe digital", "Incomum"],
  },
  {
    id: "emerald-ape-043",
    name: "Emerald Ape #043",
    collection: "Kurio Apes",
    image: "/images/jungle-green.png",
    price: 3.55,
    category: "Arte digital",
    network: "Ethereum",
    tokenId: "#0043",
    edition: "1/50",
    attributes: ["Óculos", "Esmeralda", "Épico"],
  },
  {
    id: "urban-motion-019",
    name: "Urban Motion #019",
    collection: "Nature Frames",
    image: "/images/jungle-gray.png",
    price: 2.95,
    category: "Fotografia",
    network: "Polygon",
    tokenId: "#0019",
    edition: "Aberta",
    attributes: ["Urbano", "Movimento", "Incomum"],
  },
  {
    id: "bassline-072",
    name: "Bassline #072",
    collection: "Sound Lab",
    image: "/images/jungle-orange.png",
    price: 1.45,
    category: "Música",
    network: "Solana",
    launch: true,
    tokenId: "#0072",
    edition: "1/50",
    attributes: ["Bass", "Ritmo", "Raro"],
  },
  {
    id: "hologram-entity-061",
    name: "Hologram Entity #061",
    collection: "Vessel Collection",
    image: "/images/jungle-violet.png",
    price: 11.15,
    category: "Arte 3D",
    network: "Polygon",
    tokenId: "#0061",
    edition: "1/10",
    attributes: ["Holográfico", "Entidade", "Lendário"],
  },
  {
    id: "relic-of-time-091",
    name: "Relic of Time #091",
    collection: "Nomad Society",
    image: "/images/jungle-gray.png",
    price: 8.65,
    category: "Colecionáveis",
    network: "Ethereum",
    tokenId: "#0091",
    edition: "1/10",
    attributes: ["Relíquia", "Tempo", "Lendário"],
  },
  {
    id: "infinite-lines-017",
    name: "Infinite Lines #017",
    collection: "Generative Forms",
    image: "/images/jungle-green.png",
    price: 4.75,
    category: "Generativa",
    network: "Solana",
    launch: true,
    tokenId: "#0017",
    edition: "1/50",
    attributes: ["Linhas", "Infinito", "Raro"],
  },
  {
    id: "quest-token-026",
    name: "Quest Token #026",
    collection: "Pixel Dreams",
    image: "/images/jungle-orange.png",
    price: 1.35,
    category: "Jogos",
    network: "Polygon",
    tokenId: "#0026",
    edition: "Aberta",
    attributes: ["Token de missão", "Aventura", "Incomum"],
  },
  {
    id: "collector-club-012",
    name: "Collector Club #012",
    collection: "Creator Club",
    image: "/images/jungle-violet.png",
    price: 12.8,
    category: "Assinaturas",
    network: "Ethereum",
    tokenId: "#0012",
    edition: "1/10",
    attributes: ["Colecionadores", "Clube exclusivo", "Lendário"],
  },
  {
    id: "event-pass-031",
    name: "Event Pass #031",
    collection: "Utility Keys",
    image: "/images/jungle-green.png",
    price: 1.25,
    category: "Utilidade",
    network: "Polygon",
    tokenId: "#0031",
    edition: "Aberta",
    attributes: ["Passe de evento", "Experiências", "Incomum"],
  },
  {
    id: "cosmic-bloom-119",
    name: "Cosmic Bloom #119",
    collection: "Cosmic Collection",
    image: "/images/jungle-violet.png",
    price: 5.65,
    category: "Arte digital",
    network: "Solana",
    tokenId: "#0119",
    edition: "1/50",
    attributes: ["Cósmica", "Floral", "Raro"],
  },
  {
    id: "last-light-055",
    name: "Last Light #055",
    collection: "Nature Frames",
    image: "/images/jungle-orange.png",
    price: 15,
    category: "Fotografia",
    network: "Ethereum",
    launch: true,
    tokenId: "#0055",
    edition: "1/10",
    attributes: ["Luz dourada", "Horizonte", "Lendário"],
  },
  {
    id: "genesis-artifact-001",
    name: "Genesis Artifact #001",
    collection: "Genesis Collection",
    image: "/images/jungle-gray.png",
    price: 13.75,
    originalPrice: 15,
    category: "Colecionáveis",
    network: "Ethereum",
    tokenId: "#0001",
    edition: "1/1",
    attributes: ["Artefato", "Genesis", "Lendário"],
  },
  {
    id: "origin-protocol-013",
    name: "Origin Protocol #013",
    collection: "Utility Keys",
    image: "/images/jungle-green.png",
    price: 1.02,
    category: "Utilidade",
    network: "Solana",
    tokenId: "#0013",
    edition: "Aberta",
    attributes: ["Protocolo", "Acesso digital", "Incomum"],
  },
];

export const nfts: NFT[] = nftSeeds.map(createNFT);
