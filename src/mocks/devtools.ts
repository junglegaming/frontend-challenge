import type { EditionId } from '@/schemas/nft'
import { addEth } from '@/lib/eth'
import { db } from './db'
import { findNft, nftUpdatedEvent } from './domain'
import { changeEdition } from './effects'
import { getScenario, SCENARIOS, setScenario, type ScenarioId } from './scenarios'
import { connectedUsers, deliverRaw, dropConnections, redeliverLastEvent } from './socket'

/**
 * Controles do "servidor" simulado para DevPanel e Playwright. Tudo passa pelo db e
 * pelo transporte Socket.IO mockado — nada mexe direto na UI ou no cache do cliente.
 */
const mockControls = {
  scenarios: SCENARIOS,
  getScenario,
  setScenario(id: ScenarioId) {
    setScenario(id)
  },
  reset() {
    db.reset()
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith('kurio:')) localStorage.removeItem(key)
      sessionStorage.clear()
    } catch {
      // sem storage
    }
  },
  changePrice(nftId: string, editionId: EditionId, price?: string) {
    const current = findNft(db.state, nftId).editions.find((edition) => edition.id === editionId)
    changeEdition(nftId, editionId, { price: price ?? addEth(current?.price ?? '0', '0.10') })
  },
  sellOut(nftId: string, editionId: EditionId) {
    changeEdition(nftId, editionId, { available: 0 })
  },
  dropSocket() {
    dropConnections()
  },
  expireSessions() {
    db.update((state) => {
      for (const session of state.sessions) session.expiresAt = 0
    })
  },
  duplicateLastEvent() {
    redeliverLastEvent()
  },
  /** Evento com versão antiga e preço falso: o cliente não pode regredir. */
  emitStaleEvent(nftId: string) {
    const nft = findNft(db.state, nftId)
    const event = nftUpdatedEvent(nft)
    deliverRaw({
      ...event,
      version: nft.version - 1,
      data: { editions: nft.editions.map((edition) => ({ ...edition, price: '999.00' })) },
    })
  },
  connectedUsers,
  cartFirstItem() {
    return db.state.carts.flatMap((cart) => cart.items)[0] ?? null
  },
}

type MockControls = typeof mockControls

declare global {
  interface Window {
    __kurioMock?: MockControls
  }
}

export function installDevtools() {
  window.__kurioMock = mockControls
}
