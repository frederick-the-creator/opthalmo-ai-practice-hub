import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../shared/Sidebar";
import Header from "../shared/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { fetchProfile } from '@/integrations/supabase/utils';

const AuthLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    // Skip profile check if already on /complete-profile
    if (location.pathname === "/complete-profile") {
      setProfileChecked(true);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
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
            if (!profile) {
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
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
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
            if (!profile) {
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
  if (!isAuthenticated) return <Navigate to="/login" replace />;

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
