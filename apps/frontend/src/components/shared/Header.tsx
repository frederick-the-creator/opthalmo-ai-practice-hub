import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/store/AuthProvider";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Eye, LayoutDashboard, Video, ListChecks, LogOut } from "lucide-react";

const Header: React.FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("");
  const navigate = useNavigate();
  const { signOut, user, userProfile } = useAuth();

  const navItems = [
    { path: "/dashboard", name: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/interview-scheduling", name: "Interview Practice", icon: <Video className="w-4 h-4" /> },
    { path: "/assessments", name: "Assessments", icon: <ListChecks className="w-4 h-4" /> },
  ];

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem('loginAt');
    navigate("/");
  };

  useEffect(() => {
    if (userProfile) {
      setUserName(`${userProfile.firstName} ${userProfile.lastName}`.trim());
      setUserInitials(`${userProfile.firstName?.[0] || ''}${userProfile.lastName?.[0] || ''}`.toUpperCase());
    } else {
      setUserName("");
      setUserInitials("");
    }

    const handleProfileUpdated = () => {
      // no-op: provider will refresh userProfile
    };
    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, [userProfile]);

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link to="/dashboard" className="flex items-center">
          <Eye className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">OphthalmoPrep</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              <span className="ml-2">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <Link to="/profile" className="flex items-center hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-white">{userInitials || "JD"}</AvatarFallback>
          </Avatar>
          <div className="ml-3 hidden md:block">
            <p className="text-sm font-medium text-gray-900">{userName || "Jane Doe"}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="hidden md:flex items-center px-3 py-2 rounded-md text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="ml-2">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
