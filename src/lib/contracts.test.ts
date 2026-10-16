import { describe, expect, it } from "vitest";
import { parseCatalog, parseList } from "./contracts";

describe("contratos de resposta", () => {
  it.each([
    undefined,
    null,
    {},
    "<html>App</html>",
    { total: 0, pages: 1 },
    { items: null, total: 0, pages: 1 },
  ])("recusa catálogo inválido sem acessar length: %j", (value) => {
    expect(() => parseCatalog(value)).toThrow(/catálogo.*inválidos/);
  });
  it("distingue catálogo vazio válido de falha no contrato", () => {
    expect(parseCatalog({ items: [], total: 0, pages: 1 })).toEqual({
      items: [],
      total: 0,
      pages: 1,
    });
    expect(() => parseList({})).toThrow(/lista.*inválida/);
  });
});
