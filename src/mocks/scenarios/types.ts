export type RequestKind =
  | 'control'
  | 'auth'
  | 'list'
  | 'detail'
  | 'favorites'
  | 'cart'
  | 'quote'
  | 'coupons'
  | 'orders'
  | 'profile'
  | 'wallets'
  | 'other'

export type LatencyFn = (kind: RequestKind, url: URL, method: string) => number
