
import React from "react";
import { Bell, Brain, CheckCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Reminder {
  id: number;
  text: string;
  category: 'suggestion' | 'action' | 'invitation';
}

interface NotificationsProps {
  reminders: Reminder[];
}

const Notifications: React.FC<NotificationsProps> = ({ reminders }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Bell className="h-5 w-5 mr-2 text-brand-purple" />
          Notifications & Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {reminders.map((reminder) => (
            <li key={reminder.id} className="flex items-start border-b pb-3 last:border-0 last:pb-0">
              {reminder.category === 'suggestion' && (
                <Brain className="h-5 w-5 mr-3 text-brand-purple flex-shrink-0 mt-0.5" />
              )}
              {reminder.category === 'action' && (
                <CheckCircle className="h-5 w-5 mr-3 text-brand-green flex-shrink-0 mt-0.5" />
              )}
              {reminder.category === 'invitation' && (
                <Users className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-gray-800">{reminder.text}</p>
                <Button variant="link" className="text-primary p-0 h-auto text-sm">
                  {reminder.category === 'invitation' ? 'Respond' : 'Take action'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button variant="link" className="text-primary p-0">
            View all notifications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Notifications;
