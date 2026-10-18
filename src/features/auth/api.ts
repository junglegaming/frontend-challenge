import { api } from "@/api/client";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from "@/contracts/auth";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", input);
  return response.data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", input);
  return response.data;
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await api.get<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
