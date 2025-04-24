
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../shared/Sidebar";
import Header from "../shared/Header";

const AuthLayout: React.FC = () => {
  // This is just a mock for now - will be replaced with actual auth check
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

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
