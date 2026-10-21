import Decimal from 'decimal.js'

/** ETH amounts travel as decimal strings (e.g. "1.250000000000000000"). Never use `number` for money. */
export type EthAmount = string & { readonly __brand?: 'EthAmount' }

const ETH_DECIMALS = 18
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN })

const toDecimal = (value: EthAmount) => new Decimal(value)

export const eth = {
  add: (a: EthAmount, b: EthAmount): EthAmount => toDecimal(a).plus(b).toFixed(ETH_DECIMALS),
  sub: (a: EthAmount, b: EthAmount): EthAmount => toDecimal(a).minus(b).toFixed(ETH_DECIMALS),
  mul: (a: EthAmount, quantity: number): EthAmount => {
    if (!Number.isInteger(quantity)) throw new TypeError('Quantities must be integers')
    return toDecimal(a).times(quantity).toFixed(ETH_DECIMALS)
  },
  sum: (values: EthAmount[]): EthAmount =>
    values.reduce<Decimal>((acc, v) => acc.plus(v), new Decimal(0)).toFixed(ETH_DECIMALS),
  equals: (a: EthAmount, b: EthAmount) => toDecimal(a).equals(b),
  isZero: (a: EthAmount) => toDecimal(a).isZero(),
  /** Display format: trims trailing zeros, keeps up to `maxFraction` digits without float rounding. */
  format: (value: EthAmount, maxFraction = 4) => {
    const fixed = toDecimal(value).toDecimalPlaces(maxFraction, Decimal.ROUND_DOWN)
    return `${fixed.toFixed()} ETH`
  },
}
