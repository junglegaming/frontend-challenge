import type { OrderCoupon, OrderItem } from '@/lib/http/schemas'
import { addEth, mulQty, percentOf, subEth } from '@/lib/money'
import type { StoredOrder } from '../db/store'
import { getSeedNft } from './nfts'
import { WALLET_ANA_PRINCIPAL } from './wallets'

const NETWORK_FEE = '0.0042'

const LAUNCH10: OrderCoupon = { code: 'LAUNCH10', type: 'percent', value: 10 }

const CONFIRMED_TX_HASH = `0x${'7f3c9a1e5d8b4206'.repeat(4)}`

const orderItemFromNft = (nftId: string, qty: number): OrderItem => {
  const nft = getSeedNft(nftId)
  return {
    nftId: nft.id,
    name: nft.name,
    image: nft.image,
    edition: { ...nft.edition },
    qty,
    unitPrice: nft.price,
    lineTotal: mulQty(nft.price, qty),
  }
}

const sumItems = (items: OrderItem[]): string =>
  items.reduce((total, item) => addEth(total, item.lineTotal), '0')

const walletSnapshot = {
  id: WALLET_ANA_PRINCIPAL.id,
  label: WALLET_ANA_PRINCIPAL.label,
  address: WALLET_ANA_PRINCIPAL.address,
}

const buildConfirmedOrder = (): StoredOrder => {
  const items = [orderItemFromNft('golden-signal-160', 1), orderItemFromNft('sage-nomad-009', 2)]
  const subtotal = sumItems(items)
  const discount = percentOf(subtotal, 10)
  return {
    id: 'ord_seed_confirmed',
    userId: 'usr_ana',
    status: 'confirmed',
    items,
    subtotal,
    discount,
    networkFee: NETWORK_FEE,
    total: addEth(subEth(subtotal, discount), NETWORK_FEE),
    currency: 'ETH',
    coupon: { ...LAUNCH10 },
    wallet: { ...walletSnapshot },
    network: 'ethereum',
    txHash: CONFIRMED_TX_HASH,
    explorerUrl: `https://etherscan.io/tx/${CONFIRMED_TX_HASH}`,
    quoteVersion: 1,
    idempotencyKey: '5f0e1a2b-0000-4000-8000-000000000001',
    createdAt: '2026-09-01T14:05:00.000Z',
    updatedAt: '2026-09-01T14:05:12.000Z',
    version: 2,
  }
}

const buildPendingOrder = (): StoredOrder => {
  const items = [orderItemFromNft('violet-nomad-314', 1)]
  const subtotal = sumItems(items)
  return {
    id: 'ord_seed_pending',
    userId: 'usr_ana',
    status: 'pending',
    items,
    subtotal,
    discount: '0',
    networkFee: NETWORK_FEE,
    total: addEth(subtotal, NETWORK_FEE),
    currency: 'ETH',
    coupon: null,
    wallet: { ...walletSnapshot },
    network: 'ethereum',
    quoteVersion: 1,
    idempotencyKey: '5f0e1a2b-0000-4000-8000-000000000002',
    createdAt: '2026-10-01T09:30:00.000Z',
    updatedAt: '2026-10-01T09:30:00.000Z',
    version: 1,
  }
}

export const SEED_ORDERS: StoredOrder[] = [buildConfirmedOrder(), buildPendingOrder()]
