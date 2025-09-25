import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/supabase/client";
import { fetchProfile } from "@/supabase/data";
import { Link } from "react-router-dom";

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [userName, setUserName] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("");

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const profile = await fetchProfile(userData.user.id);
        if (profile) {
          setUserName(`${profile.first_name} ${profile.last_name}`.trim());
          setUserInitials(`${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase());
        }
      }
    };
    fetchProfileData();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">
          Dashboard
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button> */}
        
        <Link to="/profile" className="flex items-center hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-white">{userInitials || "JD"}</AvatarFallback>
          </Avatar>
          <div className="ml-3 hidden md:block">
            <p className="text-sm font-medium text-gray-900">{userName || "Jane Doe"}</p>
            <p className="text-xs text-gray-500">ST2 Trainee</p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
