
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Video, 
  Brain, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Bell
} from "lucide-react";

const Dashboard: React.FC = () => {
  // Mock data
  const stats = {
    stationsDone: 24,
    stationsWeak: 7,
    progress: 68, // percentage
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
    { id: 1, text: "Practice Communication Skills", category: "suggestion" },
    { id: 2, text: "Review your recent practice sessions", category: "action" },
    { id: 3, text: "Sam invited you to practice", category: "invitation" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Welcome Back, Jane</h1>
        <p className="text-gray-600">Here's your interview preparation progress</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stats-card">
          <div className="rounded-full bg-blue-100 p-3 inline-flex mb-3">
            <Video className="h-6 w-6 text-brand-blue" />
          </div>
          <CardTitle className="text-3xl font-bold">{stats.stationsDone}</CardTitle>
          <p className="text-gray-500">Stations Completed</p>
        </Card>

        <Card className="stats-card">
          <div className="rounded-full bg-orange-100 p-3 inline-flex mb-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
          <CardTitle className="text-3xl font-bold">{stats.stationsWeak}</CardTitle>
          <p className="text-gray-500">Areas for Improvement</p>
        </Card>

        <Card className="stats-card">
          <div className="rounded-full bg-brand-light-green p-3 inline-flex mb-3">
            <BarChart3 className="h-6 w-6 text-brand-green" />
          </div>
          <CardTitle className="text-3xl font-bold">{stats.progress}%</CardTitle>
          <p className="text-gray-500">Curriculum Coverage</p>
        </Card>

        <Card className="stats-card">
          <div className="rounded-full bg-purple-100 p-3 inline-flex mb-3">
            <Clock className="h-6 w-6 text-brand-purple" />
          </div>
          <CardTitle className="text-3xl font-bold">{stats.weeklyPractice}</CardTitle>
          <p className="text-gray-500">Sessions This Week</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/interview-practice" className="col-span-1 lg:col-span-2">
          <Button className="bg-brand-blue w-full py-8 text-lg h-auto hover:bg-blue-600 group">
            <Video className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
            Start Interview Practice
          </Button>
        </Link>
        
        <Link to="/knowledge-tutor" className="col-span-1">
          <Button variant="outline" className="w-full py-8 text-lg h-auto group border-2 hover:bg-gray-50">
            <Brain className="mr-2 h-6 w-6 text-brand-purple group-hover:scale-110 transition-transform" />
            Knowledge Tutor
          </Button>
        </Link>
        
        <Link to="/community" className="col-span-1">
          <Button variant="outline" className="w-full py-8 text-lg h-auto group border-2 hover:bg-gray-50">
            <Users className="mr-2 h-6 w-6 text-brand-blue group-hover:scale-110 transition-transform" />
            Find Practice Partners
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Areas for Improvement */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {weakAreas.map((area, index) => (
                <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{area.topic}</span>
                    <span className="text-sm text-gray-500">Score: {area.score}/10</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-value" 
                      style={{ width: `${(area.score / 10) * 100}%`, backgroundColor: area.score < 5 ? '#f97316' : '#10b981' }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Link to="/curriculum">
                <Button variant="link" className="text-brand-blue p-0">
                  View all topics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Clock className="h-5 w-5 mr-2 text-brand-blue" />
              Recent Practice Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentSessions.map((session) => (
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
              <Button variant="link" className="text-brand-blue p-0">
                View all sessions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Reminders */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Bell className="h-5 w-5 mr-2 text-brand-purple" />
              Notifications & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcomingReminders.map((reminder) => (
                <li key={reminder.id} className="flex items-start border-b pb-3 last:border-0 last:pb-0">
                  {reminder.category === 'suggestion' && (
                    <Brain className="h-5 w-5 mr-3 text-brand-purple flex-shrink-0 mt-0.5" />
                  )}
                  {reminder.category === 'action' && (
                    <CheckCircle className="h-5 w-5 mr-3 text-brand-green flex-shrink-0 mt-0.5" />
                  )}
                  {reminder.category === 'invitation' && (
                    <Users className="h-5 w-5 mr-3 text-brand-blue flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-gray-800">{reminder.text}</p>
                    <Button variant="link" className="text-brand-blue p-0 h-auto text-sm">
                      {reminder.category === 'invitation' ? 'Respond' : 'Take action'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button variant="link" className="text-brand-blue p-0">
                View all notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
