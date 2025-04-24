
import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../shared/NavBar";
import Footer from "../shared/Footer";

const GuestLayout: React.FC = () => {
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
