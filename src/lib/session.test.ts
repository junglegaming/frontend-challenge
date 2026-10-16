import { describe, expect, it } from "vitest";
import { accountLabel, parseUser } from "./session";
const user = {
  id: "ana",
  name: "Ana Oliveira",
  username: "ana",
  email: "ana@kurio.demo",
  ens: "ana.eth",
  walletAlias: "Minha carteira",
  avatar: "/assets/ape-1.webp",
  wallets: [],
};
describe("dados de sessão na fronteira HTTP", () => {
  it("valida conta e extrai o primeiro nome", () =>
    expect(accountLabel(parseUser(user))).toBe("Ana"));
  it.each([undefined, null, "", "  "])(
    "recupera nome ausente ou vazio: %s",
    (name) => expect(parseUser({ ...user, name }).name).toBe("Colecionador"),
  );
  it.each(["<!doctype html>", { message: "Erro" }, null, {}])(
    "rejeita resposta que não representa usuário: %j",
    (value) => expect(() => parseUser(value)).toThrow("dados da conta"),
  );
  it("protege também o cabeçalho contra cache incompleto", () =>
    expect(
      accountLabel({ name: undefined } as unknown as { name: string }),
    ).toBe("Minha conta"));
});
