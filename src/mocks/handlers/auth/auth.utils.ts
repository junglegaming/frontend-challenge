import { initialUsers, type MockUser } from "../../data/users";

const USERS_KEY = "mock-users";

export function getUsers(): MockUser[] {
  const storedUsers = localStorage.getItem(USERS_KEY);

  if (!storedUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  }

  const users = JSON.parse(storedUsers) as Partial<MockUser>[];

  const updatedUsers: MockUser[] = users.map((user) => ({
    ...user,
    id: user.id ?? crypto.randomUUID(),
    name: user.name ?? "",
    username: user.username ?? user.email?.split("@")[0] ?? "",
    email: user.email ?? "",
    passwordHash: user.passwordHash ?? "",
    avatar: user.avatar ?? null,
    ensName: user.ensName ?? "",
    walletName: user.walletName ?? "",
  }));

  saveUsers(updatedUsers);

  return updatedUsers;
}

export function saveUsers(users: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function createToken(userId: string) {
  return `mock-token-${userId}`;
}

export async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace("Bearer ", "");

  if (!token?.startsWith("mock-token-")) {
    return null;
  }

  const userId = token.replace("mock-token-", "");

  return getUsers().find((user) => user.id === userId) ?? null;
}
