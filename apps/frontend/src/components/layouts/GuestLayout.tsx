import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import NavBar from "../shared/NavBar";
import Footer from "../shared/Footer";
import { supabase } from '@/integrations/supabase/client';

const GuestLayout: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null; // or a spinner
  if (isAuthenticated) {
    return <Navigate to="/interview-practice" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default GuestLayout;
