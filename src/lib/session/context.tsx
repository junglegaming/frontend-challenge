import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { SessionContext } from './state';
import { sessionService } from './service';

export function SessionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    sessionService.subscribe,
    sessionService.getSnapshot
  );
  useEffect(() => {
    void sessionService.ensureHydrated().catch(() => undefined);
  }, []);
  return (
    <SessionContext.Provider
      value={{
        ...snapshot,
        login: sessionService.login,
        signup: sessionService.signup,
        logout: sessionService.logout,
        retryHydration: sessionService.retryHydration,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
