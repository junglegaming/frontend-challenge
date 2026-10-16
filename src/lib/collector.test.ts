import { expect, it } from "vitest";
import { collectorErrors } from "./collector";

it("aceita pontos no usuário e campos opcionais vazios", () => {
  expect(
    collectorErrors({
      name: "Ana Oliveira",
      username: "ana.dev",
      profileName: "Coleção Ana",
      email: "ana@kurio.demo",
      referral: "",
      note: "",
      ens: "",
      secondaryWallet: "",
    }),
  ).toEqual({});
});
it("lista todos os campos obrigatórios ausentes e limites excedidos", () => {
  expect(
    Object.keys(
      collectorErrors({ note: "a".repeat(501), referral: "a".repeat(51) }),
    ),
  ).toEqual(["name", "username", "profileName", "email", "note", "referral"]);
});
