import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Header from "../shared/Header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/supabase/AuthProvider';

interface AuthLayoutProps { fullscreen?: boolean }

const AuthLayout: React.FC<AuthLayoutProps> = ({ fullscreen = false }) => {
  const { toast } = useToast();
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to access this page',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setLoading(false);
    })();
  }, [toast, session]);

  if (authLoading || loading) return null; // or a spinner
  if (!session) return <Navigate to="/" replace />;

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
