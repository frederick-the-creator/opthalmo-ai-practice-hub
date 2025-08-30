
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Menu, X } from "lucide-react";

const NavBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Eye className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-gray-900">OphthalmoPrep</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="space-x-6">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="#features" className="nav-link">Features</Link>
            <Link to="#testimonials" className="nav-link">Testimonials</Link>
          </div>
          <div className="space-x-4">
            <Link to="/login">
              <Button variant="outline" className="btn-secondary">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="btn-primary">Sign Up</Button>
            </Link>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md z-10 animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link to="/" className="nav-link py-2" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="#features" className="nav-link py-2" onClick={() => setIsOpen(false)}>Features</Link>
            <Link to="#testimonials" className="nav-link py-2" onClick={() => setIsOpen(false)}>Testimonials</Link>
            <div className="pt-2 space-y-2">
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full btn-secondary">Log In</Button>
              </Link>
              <Link to="/register" onClick={() => setIsOpen(false)}>
                <Button className="w-full btn-primary">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
