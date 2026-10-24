import Decimal from 'decimal.js'

/** Fixed, single conversion rate used for every pay-with-coins purchase (specs/011-web-coins-real-api, Assumptions). */
export const ETH_TO_COINS_RATE = 1000

/** Converts an order's ETH total into a whole-coin amount, always rounding up (never undercharge). */
export function toCoinsAmount(totalEth: string): number {
  return new Decimal(totalEth).times(ETH_TO_COINS_RATE).ceil().toNumber()
}
