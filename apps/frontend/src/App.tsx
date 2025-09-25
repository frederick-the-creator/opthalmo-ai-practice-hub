import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

import Dashboard from "./pages/Dashboard";
import InterviewPractice from "./pages/interview-scheduling/InterviewScheduling";
import AuthLayout from "./components/layouts/AuthLayout";
import GuestLayout from "./components/layouts/GuestLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CompleteProfile from "./pages/auth/CompleteProfile";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Landing from "./pages/Landing";

import InterviewPracticeRoom from "./pages/interview-room/InterviewPracticeRoom";
import NotFound from "./pages/NotFound";
import InviteAcceptPage from "./pages/interview-scheduling/InviteAcceptPage";
import AssessmentHistory from "./pages/AssessmentHistory";
import Profile from "./pages/Profile";

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
  return isAuthenticated ? <InterviewPracticeRoom /> : <Navigate to="/" replace />;
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
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Public route to support Supabase password recovery */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview-practice" element={<InterviewPractice />} />
            <Route path="/assessments" element={<AssessmentHistory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/invite/:sessionId" element={<InviteAcceptPage />} />
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