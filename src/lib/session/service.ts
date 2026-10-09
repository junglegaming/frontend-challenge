import { http } from '../http/client';
import { endpoints } from '../http/endpoints';
import {
  sessionSchema,
  loginRequestSchema,
  signupRequestSchema,
} from '../http/schemas';
import { toAppError, type AppError } from '../http/errors';
import { queryClient } from '../query/client';
import { keyFactory } from '../query/keys';
import { disconnectSocket } from '../socket/client';
import { clearCheckoutDraft, restoreCheckoutDraft } from './checkout-draft';
import {
  getAnonymousId,
  getPersistedSession,
  getStoredSession,
  storeSession,
  subscribeSession,
} from './storage';
import type { LoginRequest, Session, SignupRequest } from '@/types/api';

interface SessionSnapshot {
  session: Session | null;
  isHydrating: boolean;
  error: AppError | null;
  endReason: 'expired' | 'logout' | null;
}
let snapshot: SessionSnapshot = {
  session: null,
  isHydrating: true,
  error: null,
  endReason: null,
};
const listeners = new Set<() => void>();
let hydration: Promise<void> | undefined;
let started = false;
let observed: Session | null = null;
let expirationTimer: ReturnType<typeof setTimeout> | undefined;
let transition = 0;
let loggingOut = false;

function publish(next: SessionSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function removePrivateCache(userId: string) {
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      keyFactory.belongsToUser(query.queryKey, userId),
  };
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
}

function observeStorage() {
  const next = getStoredSession();
  const previous = observed;
  observed = next;
  if (previous?.token !== next?.token) {
    disconnectSocket();
    if (previous) removePrivateCache(previous.user.id);
    if (next && previous?.user.id !== next.user.id)
      restoreCheckoutDraft(next.user.id);
  }
  clearTimeout(expirationTimer);
  if (next)
    expirationTimer = setTimeout(
      () => {
        if (getPersistedSession()?.token === next.token) storeSession(null);
      },
      Math.max(0, Date.parse(next.expiresAt) - Date.now())
    );
  publish({
    ...snapshot,
    session: next,
    endReason: next
      ? null
      : previous
        ? loggingOut
          ? 'logout'
          : 'expired'
        : snapshot.endReason,
  });
}

function start() {
  if (started) return;
  started = true;
  observed = getPersistedSession();
  subscribeSession(observeStorage);
}

function appError(failure: unknown): AppError {
  if (failure && typeof failure === 'object' && 'kind' in failure)
    return failure as AppError;
  return toAppError(failure);
}

async function hydrate() {
  start();
  publish({ ...snapshot, isHydrating: true, error: null });
  const stored = getPersistedSession();
  try {
    if (stored) {
      const response = await http.get<unknown>(endpoints.session);
      const next = sessionSchema.parse(response.data);
      if (getPersistedSession()?.token === stored.token) storeSession(next);
    } else storeSession(null);
    publish({
      ...snapshot,
      session: getStoredSession(),
      isHydrating: false,
      error: null,
    });
  } catch (failure) {
    const error = appError(failure);
    if (error.kind === 'http' && error.status === 401) {
      publish({ ...snapshot, session: null, isHydrating: false, error: null });
    } else {
      publish({ ...snapshot, session: null, isHydrating: false, error });
      throw error;
    }
  }
}

async function authenticate(path: string, input: LoginRequest | SignupRequest) {
  await sessionService.ensureHydrated();
  const currentTransition = ++transition;
  const response = await http.post<unknown>(path, input);
  if (currentTransition !== transition)
    throw { kind: 'canceled' } satisfies AppError;
  const next = sessionSchema.parse(response.data);
  await queryClient.cancelQueries();
  if (currentTransition !== transition)
    throw { kind: 'canceled' } satisfies AppError;
  queryClient.clear();
  disconnectSocket();
  try {
    const pending = JSON.parse(
      localStorage.getItem('gm_pending_order') ?? 'null'
    ) as { userId?: string } | null;
    if (pending?.userId !== next.user.id)
      localStorage.removeItem('gm_pending_order');
  } catch {
    localStorage.removeItem('gm_pending_order');
  }
  restoreCheckoutDraft(next.user.id);
  storeSession(next);
  publish({
    session: getStoredSession(),
    isHydrating: false,
    error: null,
    endReason: null,
  });
  return next;
}

export const sessionService = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  ensureHydrated() {
    hydration ??= hydrate();
    return hydration;
  },
  retryHydration() {
    hydration = hydrate();
    return hydration;
  },
  login(input: LoginRequest) {
    return authenticate(
      endpoints.login,
      loginRequestSchema.parse({ ...input, anonymousId: getAnonymousId() })
    );
  },
  signup(input: SignupRequest) {
    return authenticate(endpoints.signup, signupRequestSchema.parse(input));
  },
  async logout() {
    transition++;
    const token = getPersistedSession()?.token;
    const request = http.post(endpoints.logout, undefined, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    loggingOut = true;
    storeSession(null);
    loggingOut = false;
    localStorage.removeItem('gm_pending_order');
    clearCheckoutDraft();
    localStorage.removeItem('gm_anon_id');
    getAnonymousId();
    removePrivateCache('anon');
    disconnectSocket();
    await request;
  },
};
