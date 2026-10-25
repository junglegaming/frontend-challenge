import type { CreateOrderInput } from '@/schemas/order'

// Acesso a storage sempre protegido: modo privado/cota cheia não pode quebrar a aplicação.
function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}

function write(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key)
    else storage().setItem(key, value)
  } catch {
    // ignora: estado volta a ser só em memória
  }
}

const local = () => window.localStorage
const session = () => window.sessionStorage

function jsonStore<T>(storage: () => Storage, key: string) {
  return {
    get(): T | null {
      const raw = read(storage, key)
      if (!raw) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },
    set(value: T | null) {
      write(storage, key, value === null ? null : JSON.stringify(value))
    },
  }
}

export const tokenStore = {
  get: () => read(local, 'kurio:token'),
  set: (token: string | null) => write(local, 'kurio:token', token),
}

/** Id do carrinho do visitante; gerado sob demanda e descartado após o merge no login. */
export const guestCartStore = {
  get(): string {
    let id = read(local, 'kurio:guest-cart')
    if (!id) {
      id = crypto.randomUUID()
      write(local, 'kurio:guest-cart', id)
    }
    return id
  },
  peek: () => read(local, 'kurio:guest-cart'),
  clear: () => write(local, 'kurio:guest-cart', null),
}

export interface PendingOrder {
  quoteId: string
  idempotencyKey: string
  orderId: string | null
  /** Corpo exato enviado: reenviar o mesmo conteúdo com a mesma chave recupera o mesmo pedido. */
  input: CreateOrderInput
}

const pendingOrderListeners = new Set<() => void>()

/**
 * Tentativa de compra em andamento, por usuário — sobrevive a refresh e reconexão.
 * Observável: todas as telas que usam a tentativa (checkout, recuperação) veem a mesma versão.
 */
export const pendingOrderStore = (userId: string) => {
  const key = `kurio:pending-order:${userId}`
  const store = jsonStore<PendingOrder>(local, key)
  return {
    get: store.get,
    /** String crua: snapshot estável para useSyncExternalStore. */
    snapshot: () => read(local, key),
    set(value: PendingOrder | null) {
      store.set(value)
      for (const listener of pendingOrderListeners) listener()
    },
    subscribe(listener: () => void) {
      pendingOrderListeners.add(listener)
      return () => {
        pendingOrderListeners.delete(listener)
      }
    },
  }
}

/** Rascunho do formulário de pagamento para retomada após sessão expirada. */
export const checkoutDraftStore = (userId: string) => jsonStore<Record<string, unknown>>(session, `kurio:checkout-draft:${userId}`)
