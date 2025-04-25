
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import NavBar from "../shared/NavBar";
import Footer from "../shared/Footer";

const GuestLayout: React.FC = () => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
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
