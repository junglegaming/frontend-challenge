import type { Network } from '@/schemas/common'
import type { CollectionId, EditionId, NftImage } from '@/schemas/nft'
import type { Wallet } from '@/schemas/wallet'
import { mulEth, percentOf } from '@/lib/eth'
import { createRandom } from './random'

export interface DbEdition {
  id: EditionId
  price: string
  available: number
}

export interface DbNft {
  id: string
  name: string
  image: NftImage
  collection: CollectionId
  network: Network
  compareAtPrice: string | null
  badge: 'RARO' | null
  description: string
  details: string
  tokenId: string
  collectionName: string
  attributes: string[]
  rating: number
  reviewsCount: number
  royalty: string
  contract: string
  gallery: NftImage[]
  editions: DbEdition[]
  createdAt: string
  isNew: boolean
  isTrending: boolean
  version: number
}

export interface DbUser {
  id: string
  username: string
  displayName: string
  email: string
  salt: string
  passwordHash: string
  avatar: string | null
  ensName: string
  walletNickname: string
}

export type DbWallet = Wallet & { userId: string }

export const COUPONS: Record<string, { percent: number; expiresAt: string }> = {
  KURIO10: { percent: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  EXPIRADO: { percent: 15, expiresAt: '2025-01-01T00:00:00.000Z' },
}

export const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}

const NAMES: { name: string; image: NftImage }[] = [
  { name: 'Emerald Ape', image: 'emerald-ape' },
  { name: 'Sage Nomad', image: 'sage-nomad' },
  { name: 'Neon Vessel', image: 'ivory-baron' },
  { name: 'Cosmic Bloom', image: 'sage-nomad' },
  { name: 'Violet Nomad', image: 'sage-nomad' },
  { name: 'Ivory Baron', image: 'ivory-baron' },
  { name: 'Golden Beat', image: 'golden-beat' },
  { name: 'Golden Frequency', image: 'golden-beat' },
  { name: 'Golden Signal', image: 'golden-beat' },
  { name: 'Jade Monarch', image: 'emerald-ape' },
  { name: 'Velvet Drifter', image: 'sage-nomad' },
  { name: 'Onyx Curator', image: 'ivory-baron' },
]

const COLLECTIONS: CollectionId[] = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'games',
  'subscriptions',
  'utility',
]
const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']
const ATTRIBUTES = ['Óculos', 'Esmeralda', 'Raro', 'Capuz', 'Fones', 'Terno', 'Dourado', 'Vintage', 'Neon']
const GALLERY: NftImage[] = ['emerald-ape', 'sage-nomad', 'golden-beat', 'ivory-baron']

function buildNfts(): DbNft[] {
  const random = createRandom(42)
  const baseDate = Date.UTC(2026, 9, 20)

  return Array.from({ length: 36 }, (_, index) => {
    const { name, image } = NAMES[index % NAMES.length]
    const number = String(random.int(1, 999)).padStart(3, '0')
    // Primeiro NFT reproduz o Figma: Emerald Ape #042 a 1.19 ETH
    const tokenNumber = index === 0 ? '042' : number
    const basePrice = index === 0 ? '1.19' : `${random.int(0, 12)}.${String(random.int(2, 99)).padStart(2, '0')}`
    const collection = index === 0 ? 'digital-art' : COLLECTIONS[index % COLLECTIONS.length]
    const network = index === 0 ? 'ethereum' : NETWORKS[random.int(0, 2)]
    const soldOutEdition = index % 7 === 3
    const editions: DbEdition[] = [
      { id: '1/1', price: mulEth(basePrice, 4), available: soldOutEdition ? 0 : 1 },
      { id: '1/10', price: mulEth(basePrice, 2), available: random.int(2, 10) },
      { id: '1/50', price: basePrice, available: random.int(5, 50) },
      { id: 'open', price: percentOf(basePrice, 50), available: 999 },
    ]

    return {
      id: `${name.toLowerCase().replaceAll(' ', '-')}-${tokenNumber}`,
      name: `${name} #${tokenNumber}`,
      image,
      collection,
      network,
      compareAtPrice: index % 5 === 2 ? percentOf(basePrice, 115) : null,
      badge: index % 6 === 5 ? 'RARO' : null,
      description: `Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na ${network === 'ethereum' ? 'Ethereum' : network === 'polygon' ? 'Polygon' : 'Solana'}, com arte desbloqueável e acesso para colecionadores.`,
      details: `${name} #${tokenNumber} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na rede. A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência.`,
      tokenId: `#${tokenNumber}`,
      collectionName: 'Kurio Apes',
      attributes: [ATTRIBUTES[index % ATTRIBUTES.length], ATTRIBUTES[(index + 3) % ATTRIBUTES.length], 'Raro'],
      rating: 4 + random.int(0, 9) / 10,
      reviewsCount: random.int(3, 40),
      royalty: 'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
      contract: `0x7A42...${random.int(1000, 9999)} · Contrato inteligente ERC-721 verificado.`,
      gallery: [image, ...GALLERY.filter((item) => item !== image)],
      editions,
      createdAt: new Date(baseDate - index * 36 * 3600 * 1000).toISOString(),
      isNew: index < 12,
      isTrending: index % 3 === 0,
      version: 1,
    }
  })
}

// Hash = sha256("kurio:" + salt + ":" + senha). Senha das contas de demonstração: Kurio@123
const USERS: DbUser[] = [
  {
    id: 'u_alice',
    username: 'alice',
    displayName: 'Alice Martins',
    email: 'alice@kurio.dev',
    salt: 'salt-alice',
    passwordHash: '76f69dfbbe6827383a6a860a2ab572c28aac39b6184a3dbb74f7d504c83e0e16',
    avatar: null,
    ensName: 'alice',
    walletNickname: 'Cofre principal',
  },
  {
    id: 'u_bob',
    username: 'bob',
    displayName: 'Bob Souza',
    email: 'bob@kurio.dev',
    salt: 'salt-bob',
    passwordHash: '872e23e4c419695b6cd84bf730400678162e5708f23e6c8fd9d919b4696c8666',
    avatar: null,
    ensName: 'bobsouza',
    walletNickname: 'Carteira do Bob',
  },
]

const WALLETS: DbWallet[] = [
  {
    id: 'w_alice_primary',
    userId: 'u_alice',
    slot: 'primary',
    displayName: 'Alice Martins',
    nickname: 'Cofre principal',
    network: 'ethereum',
    profileName: 'alice.collector',
    address: '0xA91F3c2b7D5e8F1a4B6c9D0e2F3a5B7c8D9eE82C',
    secondaryAddress: '',
    provider: 'metamask',
    referralCode: 'KURIO-ALICE',
    email: 'alice@kurio.dev',
    ensName: 'alice',
    connected: false,
    updatedAt: '2026-10-01T12:00:00.000Z',
  },
  {
    id: 'w_alice_secondary',
    userId: 'u_alice',
    slot: 'secondary',
    displayName: 'Alice Martins',
    nickname: 'Polygon diário',
    network: 'polygon',
    profileName: 'alice.daily',
    address: '0x5B7c8D9eE82CA91F3c2b7D5e8F1a4B6c9D0e2F3a',
    secondaryAddress: '',
    provider: 'coinbase',
    referralCode: 'KURIO-ALICE',
    email: 'alice@kurio.dev',
    ensName: 'alicepoly',
    connected: false,
    updatedAt: '2026-10-01T12:00:00.000Z',
  },
]

export function buildSeed() {
  return {
    users: structuredClone(USERS),
    nfts: buildNfts(),
    wallets: structuredClone(WALLETS),
  }
}
