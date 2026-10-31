import type { User } from "@/features/auth/types/auth.types";

export interface MockUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  ensName: string;
  walletName: string;
}

export const initialUsers: MockUser[] = [
  {
    id: "user-1",
    name: "Teste",
    username: "teste",
    email: "teste@email.com",
    passwordHash:
      "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f",
    avatar: null,
    ensName: "teste",
    walletName: "Minha carteira",
  },
];

export function toUser(user: MockUser): User {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    ensName: user.ensName,
    walletName: user.walletName,
  };
}
