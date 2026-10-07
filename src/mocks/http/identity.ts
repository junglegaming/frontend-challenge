/** Reads the bearer token from a request. Authorization logic lives in AuthService. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

export const GUEST_CART_HEADER = 'X-Guest-Cart'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function guestCartId(request: Request): string | null {
  const value = request.headers.get(GUEST_CART_HEADER)
  return value && UUID.test(value) ? value : null
}
