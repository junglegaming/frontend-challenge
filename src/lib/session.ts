import * as z from "zod/mini";
import type { User } from "../types";

const userSchema = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.catch(z.string().check(z.trim(), z.minLength(1)), "Colecionador"),
  username: z.string(),
  email: z.email(),
  ens: z.string(),
  walletAlias: z.string(),
  avatar: z.string(),
  wallets: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      address: z.string(),
      network: z.string(),
      primary: z.boolean(),
    }),
  ),
});

export function parseUser(value: unknown): User {
  const result = userSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      "Os dados da conta recebidos são inválidos. Tente entrar novamente.",
    );
  }
  return result.data;
}

export function accountLabel(user: Pick<User, "name">): string {
  const name = typeof user.name === "string" ? user.name.trim() : "";
  return name.split(/\s+/)[0] || "Minha conta";
}
