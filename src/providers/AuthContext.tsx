"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createBrowserClient } from "@/lib/appwrite/client";
import { Models } from "appwrite";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

  useEffect(() => {
    const { account, client } = createBrowserClient();

    // Fetch initial user
    account.get()
      .then((sessionUser) => {
        setUser(sessionUser);
      })
      .catch(() => {
        setUser(null);
      });

    // Realtime subscription for auth-related events
    const unsubscribe = client.subscribe('account', response => {
      if (response.events.includes('users.*.sessions.*.create') ||
        response.events.includes('users.*.sessions.*.delete')) {
        account.get()
          .then((sessionUser) => setUser(sessionUser))
          .catch(() => setUser(null));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
