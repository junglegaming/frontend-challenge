import Decimal from 'decimal.js';

const D = Decimal.clone({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

export type Eth = string;

// Slider numbers are integer positions, never monetary values.
export function ethToPriceStep(value: Eth): number {
  const index = parseEth(value).mul('100').toDecimalPlaces(0).toNumber();
  if (!Number.isSafeInteger(index) || index < 0)
    throw new RangeError('Preço fora da escala segura do slider');
  return index;
}

export function priceStepToEth(index: number): Eth {
  if (!Number.isSafeInteger(index) || index < 0)
    throw new RangeError('Posição inválida do slider');
  return formatEth(new D(index).div('100'));
}

export function priceSliderLimit(...values: (Eth | undefined)[]): Eth {
  return formatEth(
    D.max(
      '20',
      ...values.filter((v): v is Eth => v !== undefined).map(parseEth)
    ).ceil()
  );
}

export function formatPriceRangeValue(value: Eth): string {
  const decimal = parseEth(value);
  return decimal
    .toFixed(Math.max(2, decimal.decimalPlaces()))
    .replace('.', ',');
}

export const parseEth = (v: Eth): Decimal => {
  if (typeof v !== 'string' || !/^-?\d+(\.\d{1,18})?$/.test(v)) {
    throw new TypeError('ETH deve ser uma string decimal com até 18 casas');
  }
  return new D(v);
};

export const zeroEth = (): Eth => '0';

export const addEth = (a: Eth, b: Eth): Eth => formatEth(parseEth(a).add(b));

export const subEth = (a: Eth, b: Eth): Eth => formatEth(parseEth(a).sub(b));

export const cmpEth = (a: Eth, b: Eth): number => parseEth(a).cmp(parseEth(b));

export const mulEth = (a: Eth, b: Eth): Eth =>
  formatEth(parseEth(a).mul(parseEth(b)));

export const mulQty = (price: Eth, qty: number): Eth => {
  if (!Number.isSafeInteger(qty) || qty < 0)
    throw new RangeError('Quantidade inválida');
  return formatEth(parseEth(price).mul(qty));
};

export const percentOf = (amount: Eth, percent: number): Eth =>
  formatEth(parseEth(amount).mul(percent).div(100));

export function formatEth(
  v: Eth | Decimal,
  options: number | { maxDecimals?: number } = 18
): Eth {
  const maxDecimals =
    typeof options === 'number' ? options : (options.maxDecimals ?? 18);
  const s = (typeof v === 'string' ? parseEth(v) : v)
    .toDecimalPlaces(maxDecimals)
    .toFixed();
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

export function displayEth(
  value: Eth,
  options?: { maxDecimals?: number }
): string {
  const decimals = options?.maxDecimals ?? (cmpEth(value, '1') >= 0 ? 2 : 4);
  return `${formatEth(value, { maxDecimals: decimals })} ETH`;
}
