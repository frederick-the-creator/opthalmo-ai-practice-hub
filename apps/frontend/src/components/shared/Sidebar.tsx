import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Video, 
  BookOpen, 
  Brain, 
  Users, 
  LogOut, 
  Eye
} from "lucide-react";
import { supabase } from '@/supabase/client';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    // { path: "/dashboard", name: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/interview-practice", name: "Interview Practice", icon: <Video className="w-5 h-5" /> },
    // { path: "/curriculum", name: "Curriculum", icon: <BookOpen className="w-5 h-5" /> },
    // { path: "/knowledge-tutor", name: "Knowledge Tutor", icon: <Brain className="w-5 h-5" /> },
    // { path: "/community", name: "Community", icon: <Users className="w-5 h-5" /> }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <Eye className="h-8 w-8 text-brand-blue" />
        <span className="ml-2 text-xl font-bold">OphthalmoPrep</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-brand-blue bg-opacity-10 text-brand-blue" 
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
