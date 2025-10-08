import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import NavBar from "@/components/shared/NavBar";
import Footer from "@/components/shared/Footer";
import { useAuth } from '@/store/AuthProvider';

const GuestLayout: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    setIsAuthenticated(!!session);
    if (!authLoading) setLoading(false);
  }, [session, authLoading]);

  if (loading) return null; // or a spinner
  if (isAuthenticated && location.pathname !== "/") {
    return <Navigate to="/dashboard" replace />;
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
