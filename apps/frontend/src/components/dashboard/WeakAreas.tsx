
import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WeakArea {
  topic: string;
  score: number;
}

interface WeakAreasProps {
  areas: WeakArea[];
}

const WeakAreas: React.FC<WeakAreasProps> = ({ areas }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
          Areas for Improvement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {areas.map((area, index) => (
            <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{area.topic}</span>
                <span className="text-sm text-gray-500">Score: {area.score}/10</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-value" 
                  style={{ 
                    width: `${(area.score / 10) * 100}%`,
                    backgroundColor: area.score < 5 ? '#f97316' : '#10b981'
                  }}
                ></div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Link to="/curriculum">
            <Button variant="link" className="text-primary p-0">
              View all topics
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeakAreas;
