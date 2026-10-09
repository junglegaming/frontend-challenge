import { describe, expect, it } from 'vitest';
import {
  ethToPriceStep,
  priceStepToEth,
  priceSliderLimit,
  formatPriceRangeValue,
} from '@/lib/money';

describe('Price slider money adapter', () => {
  it('converts integer positions without floating point price arithmetic', () => {
    expect(priceStepToEth(0)).toBe('0');
    expect(priceStepToEth(2)).toBe('0.02');
    expect(priceStepToEth(1230)).toBe('12.3');
    expect(ethToPriceStep('12.30')).toBe(1230);
    expect(ethToPriceStep('0.020000000000000001')).toBe(2);
    expect(ethToPriceStep('0.025')).toBe(3);
  });
  it('expands the domain and formats exact decimal strings', () => {
    expect(priceSliderLimit()).toBe('20');
    expect(priceSliderLimit('20.01', '25.123')).toBe('26');
    expect(formatPriceRangeValue('12.30')).toBe('12,30');
    expect(formatPriceRangeValue('0.020000000000000001')).toBe(
      '0,020000000000000001'
    );
  });
  it('rejects invalid or unsafe integer positions', () => {
    expect(() => priceStepToEth(1.5)).toThrow(RangeError);
    expect(() => priceStepToEth(-1)).toThrow(RangeError);
    expect(() => ethToPriceStep('999999999999999999')).toThrow(RangeError);
  });
});
