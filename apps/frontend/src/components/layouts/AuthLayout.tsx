import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../shared/Sidebar";
import Header from "../shared/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/supabase/client';
import { fetchProfile } from '@/supabase/data';

const AuthLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const isOnCompleteProfile = location.pathname === "/complete-profile";

    const handleAuthFromUrl = async () => {
      try {
        const url = new URL(window.location.href);
        const hasCodeParam = !!url.searchParams.get('code');
        const errorDescription = url.searchParams.get('error_description');

        if (errorDescription) {
          toast({
            title: 'Authentication error',
            description: errorDescription,
            variant: 'destructive',
          });
        }

        if (hasCodeParam) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            toast({
              title: 'Authentication failed',
              description: error.message,
              variant: 'destructive',
            });
          } else {
            // Clean up auth params and any trailing hash from the URL
            window.history.replaceState({}, document.title, `${url.origin}${url.pathname}`);
          }
        } else if (url.hash) {
          // Handle hash-based tokens (e.g., access_token/refresh_token) if present
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            try {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (error) {
                toast({ title: 'Authentication failed', description: error.message, variant: 'destructive' });
              }
            } catch (_e) {
              // ignore setSession errors here; downstream checks will handle
            }
          }
          // Remove leftover hash fragments from URL regardless
          window.history.replaceState({}, document.title, `${url.origin}${url.pathname}${url.search}`);
        }
      } catch (_err) {
        // ignore URL parsing errors
      }
    };

    (async () => {
      await handleAuthFromUrl();

      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to access this page',
          variant: 'destructive',
        });
      }
      if (session) {
        (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const profile = await fetchProfile(user.id);
            if (!profile && !isOnCompleteProfile) {
              navigate('/complete-profile');
              return;
            }
          }
          setProfileChecked(true);
        })();
      } else {
        setProfileChecked(true);
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
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
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const profile = await fetchProfile(user.id);
            if (!profile && !isOnCompleteProfile) {
              navigate('/complete-profile');
              return;
            }
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
  }, [toast, navigate, location.pathname]);

  if (loading || !profileChecked) return null; // or a spinner
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
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
