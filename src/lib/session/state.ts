import { createContext, useContext } from 'react';
import type { AppError } from '../http/errors';
import type { LoginRequest, Session, SignupRequest } from '@/types/api';

export interface SessionState {
  session: Session | null;
  isHydrating: boolean;
  error: AppError | null;
  login: (input: LoginRequest) => Promise<Session>;
  signup: (input: SignupRequest) => Promise<Session>;
  logout: () => Promise<void>;
  retryHydration: () => Promise<void>;
}

export const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession requer SessionProvider');
  return context;
}
