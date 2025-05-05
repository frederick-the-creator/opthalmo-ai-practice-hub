
import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  iconColor: string;
  bgColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon: Icon, 
  value, 
  label, 
  iconColor, 
  bgColor 
}) => {
  return (
    <Card className="stats-card">
      <div className={`rounded-full ${bgColor} p-3 inline-flex mb-3`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <CardTitle className="text-3xl font-bold">{value}</CardTitle>
      <p className="text-gray-500">{label}</p>
    </Card>
  );
};

export default StatsCard;
