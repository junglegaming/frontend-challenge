const COUPON_STORAGE_KEY = 'kurio:coupon'

/**
 * Cupom escolhido no carrinho, levado até o pagamento (mesma aba). A validade
 * é sempre conferida pela cotação da API.
 *
 * @returns O código salvo, ou `undefined`.
 */
export function readStoredCoupon(): string | undefined {
  return sessionStorage.getItem(COUPON_STORAGE_KEY) ?? undefined
}

/**
 * Salva ou remove o cupom escolhido.
 *
 * @param code - Código do cupom; `undefined` remove.
 */
export function storeCoupon(code: string | undefined): void {
  if (code) sessionStorage.setItem(COUPON_STORAGE_KEY, code)
  else sessionStorage.removeItem(COUPON_STORAGE_KEY)
}
