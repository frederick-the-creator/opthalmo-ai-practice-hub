import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabaseClient";
import { fetchProfile } from "@/services/database/data";
import type { Profile } from "@/types";
import { toast as showToast } from "@/hooks/use-toast";

export type ToastVariant = "default" | "destructive";
export type ToastArgs = { title?: React.ReactNode; description?: React.ReactNode; variant?: ToastVariant };
export type ToastFn = (args: ToastArgs) => void;

// Keep existing helper to process auth params from URL
export async function AuthFromUrl(toast?: ToastFn): Promise<void> {
  try {
    const url = new URL(window.location.href);
    const hasCodeParam = !!url.searchParams.get("code");
    const errorDescription = url.searchParams.get("error_description");
    const emailChange = url.searchParams.get("email_change");

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
    } else if (emailChange === "1") {
      // Email change confirmation redirect
      if (toast) toast({ title: "Email updated", description: "Your email address has been changed." });
      window.history.replaceState({}, document.title, `${url.origin}${url.pathname}`);
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
  userProfile: Profile | null;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({ user: null, session: null, loading: true, signOut: async () => {}, userProfile: null, reloadProfile: async () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mountedRef = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Hard session time-to-live regardless of token refreshes
  const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 days

  const processSession = async (
    nextSession: Session | null,
    context: "initial" | "listener",
    event?: string
  ) => {
    if (!mountedRef.current) return;

    if (nextSession) {
      const now = Date.now();
      const loginAtRaw = localStorage.getItem("loginAt");
      if (loginAtRaw) {
        const loginAt = Number(loginAtRaw);
        if (Number.isFinite(loginAt) && now - loginAt > SESSION_TTL_MS) {
          await supabase.auth.signOut();
          localStorage.removeItem("loginAt");
          showToast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
          setSession(null);
          setUser(null);
          setLoading(false);
          navigate("/");
          return;
        }
      } else {
        localStorage.setItem("loginAt", String(now));
      }
    }

    setSession(nextSession ?? null);
    setUser(nextSession?.user ?? null);
    setLoading(false);

    // Ensure we have the freshest user data (e.g., after email change)
    if (nextSession) {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          setUser(data.user);
        }
      } catch (_e) {}
    }

    if (!nextSession) {
      setUserProfile(null);
      const shouldToast = context === "initial" || (context === "listener" && event !== "SIGNED_OUT");
      if (shouldToast) {
        showToast({ title: "Authentication required", description: "Please log in to access this page", variant: "destructive" });
      }
      return;
    }

    // Fetch profile and expose it; redirect if missing (except on complete-profile)
    try {
      const profile = await fetchProfile(nextSession.user.id);
      setUserProfile(profile);
      const urlPath = location.pathname;
      if (!profile && urlPath !== "/complete-profile") {
        navigate("/complete-profile");
      }
    } catch (_e) {}
  };

  const reloadProfile = async () => {
    const currentUserId = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user?.id : user?.id;
    if (!currentUserId) return;
    try {
      const profile = await fetchProfile(currentUserId);
      setUserProfile(profile);
      // Notify listeners that profile has updated (optional)
      try { window.dispatchEvent(new Event('profileUpdated')); } catch (_e) {}
    } catch (_e) {}
  };

  useEffect(() => {
    mountedRef.current = true;

    // Handle auth params from URL (email links, magic links)
    AuthFromUrl(showToast).finally(() => {
      // After URL processing, fetch and process session
      supabase.auth.getSession().then(({ data }) => {
        processSession(data.session ?? null, "initial");
      });
    });

    // Subscribe to further auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange((evt, newSession) => {
      processSession(newSession ?? null, "listener", evt);
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
    setUserProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signOut, userProfile, reloadProfile }), [user, session, loading, signOut, userProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}


