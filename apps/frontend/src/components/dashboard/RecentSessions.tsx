
import React from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Session {
  id: number;
  type: string;
  topic: string;
  date: string;
  score: number;
  partner: string;
}

interface RecentSessionsProps {
  sessions: Session[];
}

const RecentSessions: React.FC<RecentSessionsProps> = ({ sessions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary" />
          Recent Practice Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id} className="border-b pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{session.topic}</h3>
                  <div className="flex text-sm text-gray-500 mt-1">
                    <span className="mr-2">{session.type}</span>
                    <span>with {session.partner}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{session.score}/10</div>
                  <div className="text-sm text-gray-500">{session.date}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button variant="link" className="text-primary p-0">
            View all sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentSessions;
