import { describe, it, expect } from "vitest";
import { fromWei, toWei } from "./domain";
describe("ETH decimal sem ponto flutuante", () => {
  it("preserva o menor wei", () =>
    expect(fromWei(toWei("0.000000000000000001"))).toBe(
      "0.000000000000000001",
    ));
  it("soma preços sem imprecisão", () =>
    expect(fromWei(toWei("0.1") + toWei("0.2"))).toBe("0.3"));
  it("aplica desconto sem arredondar para número JS", () => {
    const subtotal = toWei("1.19") * 2n;
    expect(fromWei(subtotal - subtotal / 10n + toWei("0.005"))).toBe("2.147");
  });
  it("rejeita valores negativos, expoentes e precisão excessiva", () => {
    for (const value of ["-1", "1e18", "NaN", "0.1234567890123456789"])
      expect(() => toWei(value)).toThrow();
  });
});
