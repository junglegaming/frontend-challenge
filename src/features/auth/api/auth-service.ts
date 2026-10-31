import { api } from "@/lib/axios";
import type {
  AuthResponse,
  LoginDTO,
  RegisterDTO,
  SessionResponse,
} from "../types/auth.types";

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDTO {
  name: string;
  username: string;
  email: string;
  ensName: string;
  walletName: string;
  avatar: string | null;
}

export const authService = {
  login: async (data: LoginDTO) => {
    const response = await api.post<AuthResponse>("/auth/login", data);

    return response.data;
  },

  register: async (data: RegisterDTO) => {
    const response = await api.post<AuthResponse>("/auth/register", data);

    return response.data;
  },

  getSession: async () => {
    const response = await api.get<SessionResponse>("/auth/session");

    return response.data;
  },

  changePassword: async (data: ChangePasswordDTO) => {
    const response = await api.patch("/auth/password", data);

    return response.data;
  },

  updateProfile: async (data: UpdateProfileDTO) => {
    const response = await api.patch("/auth/profile", data);
    return response.data;
  },
};
