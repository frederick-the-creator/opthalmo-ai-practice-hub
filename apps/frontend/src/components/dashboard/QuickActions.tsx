
import React from "react";
import { Link } from "react-router-dom";
import { Video, Brain, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const QuickActions: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      <Link to="/interview-scheduling" className="col-span-1 lg:col-span-2">
        <Button className="bg-primary w-full py-8 text-lg h-auto hover:bg-accent group">
          <Video className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
          Start Interview Practice
        </Button>
      </Link>
      
      {/* <Link to="/knowledge-tutor" className="col-span-1">
        <Button variant="outline" className="w-full py-8 text-lg h-auto group border-2 hover:bg-gray-50">
          <Brain className="mr-2 h-6 w-6 text-brand-purple group-hover:scale-110 transition-transform" />
          Knowledge Tutor
        </Button>
      </Link>
      
      <Link to="/community" className="col-span-1">
        <Button variant="outline" className="w-full py-8 text-lg h-auto group border-2 hover:bg-gray-50">
          <Users className="mr-2 h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
          Find Practice Partners
        </Button>
      </Link> */}
    </div>
  );
};

export default QuickActions;
