import Big from 'big.js'

/**
 * Soma dois valores monetários em ETH representados como string decimal.
 * @param a primeiro valor em ETH.
 * @param b segundo valor em ETH.
 * @returns a soma de `a` e `b` como string.
 */
export function add(a: string, b: string): string {
  return new Big(a).add(b).toString()
}

/**
 * Subtrai `b` de `a`, ambos em ETH como string decimal.
 * @param a valor do qual será subtraído.
 * @param b valor a subtrair.
 * @returns a diferença `a - b` como string.
 */
export function sub(a: string, b: string): string {
  return new Big(a).minus(b).toString()
}

/**
 * Multiplica dois valores monetários em ETH.
 * @param a primeiro fator.
 * @param b segundo fator.
 * @returns o produto `a * b` como string.
 */
export function mul(a: string, b: string): string {
  return new Big(a).times(b).toString()
}

/**
 * Divide `a` por `b`, ambos em ETH como string decimal.
 * @param a dividendo.
 * @param b divisor.
 * @returns o quociente `a / b` como string.
 */
export function div(a: string, b: string): string {
  return new Big(a).div(b).toString()
}

/**
 * Compara dois valores monetários.
 * @param a primeiro valor.
 * @param b segundo valor.
 * @returns -1 se `a < b`, 0 se `a === b`, 1 se `a > b`.
 */
export function compare(a: string, b: string): number {
  return new Big(a).cmp(b)
}

/**
 * Verifica se um valor monetário é zero.
 * @param value valor em ETH.
 * @returns `true` se `value` for igual a zero.
 */
export function isZero(value: string): boolean {
  return new Big(value).eq(0)
}

/**
 * Formata um valor em ETH preservando até 6 casas decimais, removendo zeros à direita.
 * Não arredonda o valor; apenas descarta casas decimais excedentes.
 * @param value valor em ETH como string decimal.
 * @returns o valor formatado (ex.: "1.190000" vira "1.19").
 */
export function formatEth(value: string): string {
  const big = new Big(value)
  const isNegative = big.lt(0)
  const [intPart = '0', decPart = ''] = big.abs().toString().split('.')

  const decimals = decPart.slice(0, 6).replace(/0+$/, '')

  if (decimals.length === 0) {
    return isNegative ? `-${intPart}` : intPart
  }

  return `${isNegative ? '-' : ''}${intPart}.${decimals}`
}
