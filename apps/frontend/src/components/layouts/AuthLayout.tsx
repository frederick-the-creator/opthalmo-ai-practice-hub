import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import Header from "../shared/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/supabase/client';
import { AuthFromUrl, useAuth } from '@/supabase/AuthProvider';
import { fetchProfile } from '@/supabase/data';

// Hard session time-to-live (e.g., 3 days) regardless of token refreshes
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 2;

interface AuthLayoutProps { fullscreen?: boolean }

const AuthLayout: React.FC<AuthLayoutProps> = ({ fullscreen = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { session, loading: authLoading, signOut } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const isOnCompleteProfile = location.pathname === "/complete-profile";

    // Extract authorisation from URL to handle supabase email link

    (async () => {
      await AuthFromUrl(toast);

      const currentSession = session ?? null;
      // Enforce hard session TTL
      if (currentSession) {
        const now = Date.now();
        const loginAtRaw = localStorage.getItem('loginAt');
        if (loginAtRaw) {
          const loginAt = Number(loginAtRaw);
          if (Number.isFinite(loginAt) && now - loginAt > SESSION_TTL_MS) {
            await signOut();
            localStorage.removeItem('loginAt');
            toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
            setIsAuthenticated(false);
            setLoading(false);
            setProfileChecked(true);
            navigate('/');
            return;
          }
        } else {
          localStorage.setItem('loginAt', String(now));
        }
      }
      setIsAuthenticated(!!currentSession);
      setLoading(false);
      if (!currentSession) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to access this page',
          variant: 'destructive',
        });
      }
      if (currentSession) {
        (async () => {
          const profile = await fetchProfile(currentSession.user.id);
          if (!profile && !isOnCompleteProfile) {
            navigate('/complete-profile');
            return;
          }
          setProfileChecked(true);
        })();
      } else {
        setProfileChecked(true);
      }
    })();
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Enforce hard session TTL on any auth state change
      if (session) {
        const now = Date.now();
        const loginAtRaw = localStorage.getItem('loginAt');
        if (loginAtRaw) {
          const loginAt = Number(loginAtRaw);
          if (Number.isFinite(loginAt) && now - loginAt > SESSION_TTL_MS) {
            await signOut();
            localStorage.removeItem('loginAt');
            toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
            setIsAuthenticated(false);
            setProfileChecked(true);
            navigate('/');
            return;
          }
        } else {
          localStorage.setItem('loginAt', String(now));
        }
      }
      setIsAuthenticated(!!session);
      if (!session) {
        // Suppress auth-required toast on intentional logout
        if (event !== 'SIGNED_OUT') {
          toast({
            title: 'Authentication required',
            description: 'Please log in to access this page',
            variant: 'destructive',
          });
        }
      }
      if (session) {
        (async () => {
          const profile = await fetchProfile(session.user.id);
          if (!profile && !isOnCompleteProfile) {
            navigate('/complete-profile');
            return;
          }
          setProfileChecked(true);
        })();
      } else {
        setProfileChecked(true);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [toast, navigate, location.pathname, session, signOut]);

  if (authLoading || loading || !profileChecked) return null; // or a spinner
  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (fullscreen) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
