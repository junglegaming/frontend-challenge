import { sessionSchema } from '../http/schemas';
import type { Session } from '@/types/api';

export const SESSION_STORAGE_KEY = 'gm_session';
const listeners = new Set<() => void>();

export function getPersistedSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    const parsed = sessionSchema.safeParse(raw ? JSON.parse(raw) : null);
    return parsed.success && parsed.data.token ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getStoredSession(): Session | null {
  const session = getPersistedSession();
  return session && Date.parse(session.expiresAt) > Date.now() ? session : null;
}

export function expireSession(token: string): void {
  if (getPersistedSession()?.token === token) storeSession(null);
}

export function storeSession(session: Session | null): void {
  if (session)
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(sessionSchema.parse(session))
    );
  else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function getAnonymousId(): string {
  const stored = localStorage.getItem('gm_anon_id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('gm_anon_id', id);
  return id;
}
