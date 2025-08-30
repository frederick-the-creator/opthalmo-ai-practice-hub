
import React from "react";
import { Video, AlertTriangle, BarChart3, Clock } from "lucide-react";
import StatsCard from "./StatsCard";

interface StatsOverviewProps {
  stats: {
    stationsDone: number;
    stationsWeak: number;
    progress: number;
    weeklyPractice: number;
  };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        icon={Video}
        value={stats.stationsDone}
        label="Stations Completed"
        iconColor="text-primary"
        bgColor="bg-blue-100"
      />
      <StatsCard
        icon={AlertTriangle}
        value={stats.stationsWeak}
        label="Areas for Improvement"
        iconColor="text-orange-500"
        bgColor="bg-orange-100"
      />
      <StatsCard
        icon={BarChart3}
        value={`${stats.progress}%`}
        label="Curriculum Coverage"
        iconColor="text-brand-green"
        bgColor="bg-brand-light-green"
      />
      <StatsCard
        icon={Clock}
        value={stats.weeklyPractice}
        label="Sessions This Week"
        iconColor="text-brand-purple"
        bgColor="bg-purple-100"
      />
    </div>
  );
};

export default StatsOverview;
