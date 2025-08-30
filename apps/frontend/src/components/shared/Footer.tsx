
import React from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link to="/" className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">OphthalmoPrep</span>
            </Link>
            <p className="mt-4 text-gray-300">
              Revolutionizing ophthalmology interview preparation with AI-powered feedback and community practice.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="#testimonials" className="hover:text-primary transition-colors">Testimonials</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Log In</Link></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-300">Have questions?</p>
            <p className="text-gray-300">Email us at: contact@ophthalmoprep.com</p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">Twitter</a>
              <a href="#" className="text-gray-300 hover:text-white">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} OphthalmoPrep. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
