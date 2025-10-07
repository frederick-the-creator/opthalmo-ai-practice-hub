import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard/Dashboard";
import InterviewScheduling from "./pages/interviewScheduling/InterviewScheduling";
import AuthLayout from "./components/layouts/AuthLayout";
import GuestLayout from "./components/layouts/GuestLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CompleteProfile from "./pages/profile/CompleteProfile";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Landing from "./pages/landing/Landing";

import InterviewPracticeRoom from "./pages/interviewRoom/InterviewPracticeRoom";
import NotFound from "./pages/notFound/NotFound";
import InviteAcceptPage from "./components/interviewScheduling/InviteAcceptPage";
import AssessmentHistory from "./pages/assessmentHistory/AssessmentHistory";
import Profile from "./pages/profile/Profile";
import RescheduleForm from "./pages/reschedule/RescheduleForm";
// Retired approve/decline pages in favor of decision page
import DecisionPage from "./pages/reschedule/DecisionPage";
import { AuthProvider } from "./store/AuthProvider";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest Routes */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Routes (standard chrome) */}
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview-scheduling" element={<InterviewScheduling />} />
            <Route path="/assessments" element={<AssessmentHistory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/invite/:roomId" element={<InviteAcceptPage />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
          </Route>

          {/* Full-screen Protected Route (no chrome) */}
          <Route element={<AuthLayout fullscreen />}>
            <Route path="/interview-practice-room" element={<InterviewPracticeRoom />} />
          </Route>

          {/* Public Routes */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reschedule" element={<RescheduleForm />} />
          <Route path="/decision" element={<DecisionPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;