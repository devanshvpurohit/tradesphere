"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  user: User | null;
  status: SessionStatus;
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setStatus(session ? "authenticated" : "unauthenticated");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setStatus(session ? "authenticated" : "unauthenticated");
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async (options?: { callbackUrl?: string }) => {
    await supabase.auth.signOut();
    window.location.href = options?.callbackUrl || "/auth/signin";
  };

  return (
    <AuthContext.Provider value={{ user, status, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useSession must be used within an AuthProvider");
  }
  return {
    data: context.user ? { user: context.user } : null,
    status: context.status,
  };
}

export function signOut(options?: { callbackUrl?: string }) {
  const supabase = createClient();
  return supabase.auth.signOut().then(() => {
    window.location.href = options?.callbackUrl || "/auth/signin";
  });
}
