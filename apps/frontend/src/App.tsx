import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import InterviewPractice from "./pages/InterviewPractice";
import Curriculum from "./pages/Curriculum";
import KnowledgeTutor from "./pages/KnowledgeTutor";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";
import AuthLayout from "./components/layouts/AuthLayout";
import GuestLayout from "./components/layouts/GuestLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import InterviewPracticeRoom from "./pages/InterviewPracticeRoom";
import CompleteProfile from "./pages/auth/CompleteProfile";

const queryClient = new QueryClient();

function ProtectedInterviewPracticeRoom() {
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
  return isAuthenticated ? <InterviewPracticeRoom /> : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Guest Routes */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview-practice" element={<InterviewPractice />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/knowledge-tutor" element={<KnowledgeTutor />} />
            <Route path="/community" element={<Community />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
          </Route>

          {/* Full-screen Protected Route */}
          <Route
            path="/interview-practice-room"
            element={<ProtectedInterviewPracticeRoom />}
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;