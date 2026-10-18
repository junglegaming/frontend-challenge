import { useState } from "react";

import type { User } from "@/contracts/auth";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: React.ReactNode;
}

interface StoredSession {
  user: User;
  token: string;
}

const STORAGE_KEY = "kurio-auth";

function getStoredSession(): StoredSession | null {
  const storedSession = localStorage.getItem(STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as StoredSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSessionState] = useState<StoredSession | null>(
    getStoredSession,
  );

  function setSession(user: User, token: string) {
    const newSession = {
      user,
      token,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(newSession),
    );

    setSessionState(newSession);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSessionState(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: Boolean(session),
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}