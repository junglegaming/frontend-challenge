import type { Store } from '../../infra/store'
import type { CartRecord, MockState } from '../../state'

export class CartRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  find(cartId: string): CartRecord {
    return this.store.read((s) => structuredClone(s.carts[cartId]) ?? emptyCart(cartId))
  }

  save(cart: CartRecord) {
    this.store.write((s) => {
      s.carts[cart.id] = { ...cart, updatedAt: new Date().toISOString() }
    })
  }

  delete(cartId: string) {
    this.store.write((s) => {
      delete s.carts[cartId]
    })
  }
}

const emptyCart = (id: string): CartRecord => ({ id, lines: [], couponCode: null, updatedAt: new Date(0).toISOString() })
