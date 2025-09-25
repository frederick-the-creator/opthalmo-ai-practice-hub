import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";

export type ToastVariant = "default" | "destructive";
export type ToastArgs = { title?: React.ReactNode; description?: React.ReactNode; variant?: ToastVariant };
export type ToastFn = (args: ToastArgs) => void;

// Keep existing helper to process auth params from URL
export async function AuthFromUrl(toast?: ToastFn): Promise<void> {
  try {
    const url = new URL(window.location.href);
    const hasCodeParam = !!url.searchParams.get("code");
    const errorDescription = url.searchParams.get("error_description");

    if (errorDescription && toast) {
      toast({ title: "Authentication error", description: errorDescription, variant: "destructive" });
    }

    if (hasCodeParam) {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        if (toast) toast({ title: "Authentication failed", description: error.message, variant: "destructive" });
      } else {
        window.history.replaceState({}, document.title, `${url.origin}${url.pathname}`);
      }
    } else if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error && toast) {
            toast({ title: "Authentication failed", description: error.message, variant: "destructive" });
          }
        } catch (_e) {}
      }
      window.history.replaceState({}, document.title, `${url.origin}${url.pathname}${url.search}`);
    }
  } catch (_err) {}
}

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({ user: null, session: null, loading: true, signOut: async () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mountedRef = useRef(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    // Initial session fetch
    supabase.auth.getSession().then(({ data }) => {
      if (!mountedRef.current) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to further auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      if (!mountedRef.current) return;
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = useMemo(() => async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem('loginAt');
    } catch (_e) {}
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signOut }), [user, session, loading, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}


