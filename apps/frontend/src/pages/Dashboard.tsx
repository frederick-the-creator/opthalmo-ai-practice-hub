
import React from "react";
import StatsOverview from "@/components/dashboard/StatsOverview";
import QuickActions from "@/components/dashboard/QuickActions";
import WeakAreas from "@/components/dashboard/WeakAreas";
import RecentSessions from "@/components/dashboard/RecentSessions";
import Notifications from "@/components/dashboard/Notifications";

const Dashboard: React.FC = () => {
  // Mock data
  const stats = {
    stationsDone: 24,
    stationsWeak: 7,
    progress: 68,
    weeklyPractice: 4,
  };

  const weakAreas = [
    { topic: "Diabetic Retinopathy", score: 3.2 },
    { topic: "Glaucoma Assessment", score: 3.5 },
    { topic: "Breaking Bad News", score: 4.0 },
  ];

  const recentSessions = [
    { 
      id: 1, 
      type: "Clinical", 
      topic: "Cataract Assessment", 
      date: "Yesterday", 
      score: 7.8,
      partner: "Sarah T." 
    },
    { 
      id: 2, 
      type: "Communication", 
      topic: "Explaining Surgery Risks", 
      date: "3 days ago", 
      score: 6.5,
      partner: "AI Practice" 
    },
    { 
      id: 3, 
      type: "Clinical", 
      topic: "Retinal Detachment", 
      date: "5 days ago", 
      score: 8.2,
      partner: "Michael B." 
    },
  ];

  const upcomingReminders = [
    { id: 1, text: "Practice Communication Skills", category: "suggestion" as const },
    { id: 2, text: "Review your recent practice sessions", category: "action" as const },
    { id: 3, text: "Sam invited you to practice", category: "invitation" as const },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Welcome Back, Jane</h1>
        <p className="text-gray-600">Here's your interview preparation progress</p>
      </div>

      <StatsOverview stats={stats} />
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeakAreas areas={weakAreas} />
        <RecentSessions sessions={recentSessions} />
        <Notifications reminders={upcomingReminders} />
      </div>
    </div>
  );
};

export default Dashboard;
