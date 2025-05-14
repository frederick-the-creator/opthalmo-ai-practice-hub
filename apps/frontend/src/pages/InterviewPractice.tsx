import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Users, 
  Link as LinkIcon, 
  Clock, 
  CalendarClock,
  UserRound,
  Stethoscope,
  MessageSquare,
  Copy,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

const InterviewPractice: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://ophthalmoprep.com/invite/ABC123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock upcoming sessions
  const upcomingSessions = [
    {
      id: 1,
      name: "Sarah T.",
      avatar: "S",
      date: "2024-06-20",
      time: "18:00",
      type: "Clinical Station"
    },
    {
      id: 2,
      name: "Michael B.",
      avatar: "M",
      date: "2024-06-21",
      time: "19:30",
      type: "Communication Station"
    },
    {
      id: 3,
      name: "Aisha K.",
      avatar: "A",
      date: "2024-06-22",
      time: "17:00",
      type: "Random Station"
    },
  ];

  // State for scheduling form
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState("");

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Interview Practice</h1>
          <p className="text-gray-600">Practice clinical and communication stations</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button className="bg-brand-blue text-white" onClick={() => navigate('/interview-practice-room')}>
            Start Practice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="community" className="mb-8">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="community">
            <Users className="mr-2 h-4 w-4" />
            Community Match
          </TabsTrigger>
          <TabsTrigger value="direct">
            <LinkIcon className="mr-2 h-4 w-4" />
            Direct Invite
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="community" className="space-y-6 mt-6">
          {/* Filter options would go here */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <CardTitle>Practice Sessions</CardTitle>
                  <CardDescription>
                    Join or view your scheduled interviews
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="schedule" className="p-0">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="schedule">Available Sessions</TabsTrigger>
                      <TabsTrigger value="my">My Upcoming Sessions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="schedule">
                      <ul className="divide-y">
                        {upcomingSessions.map((session) => (
                          <li key={session.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center">
                              <Avatar>
                                <AvatarFallback>{session.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="ml-3">
                                <p className="font-medium">{session.name}</p>
                                <div className="flex text-sm text-gray-500">
                                  <span>{session.type}</span>
                                  <span className="mx-2">•</span>
                                  <span>{new Date(session.date + 'T' + session.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" className="bg-brand-blue">
                              Accept Invitation
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="my">
                      {/* Replace with real data if available */}
                      <ul className="divide-y">
                        <li className="p-4 text-gray-500 text-center">You have no upcoming interviews.</li>
                      </ul>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Practice Session</CardTitle>
                <CardDescription>
                  Select a date, time, and session type to schedule a session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    fromDate={new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clinical Station">Clinical Station</SelectItem>
                      <SelectItem value="Communication Station">Communication Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-brand-blue">
                  Schedule Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="direct" className="mt-6">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Generate Invite Link</CardTitle>
              <CardDescription>
                Create a shareable link to invite someone to practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md flex items-center justify-between">
                <span className="text-gray-700 text-sm overflow-hidden overflow-ellipsis">
                  https://ophthalmoprep.com/invite/ABC123
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div>
                <h3 className="font-medium mb-2">Session Options:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <Button className="justify-start" variant="outline">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    Clinical Station
                  </Button>
                  <Button className="justify-start" variant="outline">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Communication Station
                  </Button>
                </div>

                <Button className="w-full bg-brand-blue">
                  Generate New Session Link
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">How it works:</h3>
                <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                  <li>Generate a link and share it with your practice partner</li>
                  <li>They can join immediately when ready</li>
                  <li>Both select your roles (Candidate or Actor)</li>
                  <li>Complete the station with AI feedback</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewPractice;
