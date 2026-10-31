export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  ensName: string;
  walletName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SessionResponse {
  user: User;
}