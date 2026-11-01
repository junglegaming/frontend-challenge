/**
 * Aceita só caminhos internos como destino pós-login. Bloqueia URLs absolutas
 * e protocol-relative (`//host`), que transformariam o `?redirect=` em um
 * redirecionamento aberto para outro site.
 *
 * @param value - Valor bruto do parâmetro `redirect`.
 * @returns O caminho interno, ou `undefined` se inválido.
 * @example
 * toSafeRedirect('/pagamento') // '/pagamento'
 * toSafeRedirect('https://evil.example') // undefined
 */
export function toSafeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined
  return value
}
