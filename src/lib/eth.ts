// Valores ETH trafegam como string decimal; toda aritmética acontece em wei (bigint).
const DECIMALS = 18
const WEI = 10n ** BigInt(DECIMALS)
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export function toWei(value: string): bigint {
  if (!ETH_PATTERN.test(value)) throw new Error(`Valor ETH inválido: ${value}`)
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * WEI + BigInt(fraction.padEnd(DECIMALS, '0'))
}

/** Sem zeros à direita, mas sempre com pelo menos 2 casas ("0.30", "26.846"). */
export function fromWei(wei: bigint): string {
  const whole = wei / WEI
  const fraction = (wei % WEI).toString().padStart(DECIMALS, '0').replace(/0+$/, '').padEnd(2, '0')
  return `${whole}.${fraction}`
}

export function addEth(...values: string[]): string {
  return fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))
}

export function subEth(a: string, b: string): string {
  const result = toWei(a) - toWei(b)
  return fromWei(result < 0n ? 0n : result)
}

export function mulEth(value: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`Quantidade inválida: ${quantity}`)
  return fromWei(toWei(value) * BigInt(quantity))
}

export function percentOf(value: string, percent: number): string {
  return fromWei((toWei(value) * BigInt(percent)) / 100n)
}

export function compareEth(a: string, b: string): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

export function formatEth(value: string): string {
  return `${fromWei(toWei(value))} ETH`
}
