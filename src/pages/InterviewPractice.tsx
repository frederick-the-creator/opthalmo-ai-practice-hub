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

const InterviewPractice: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://ophthalmoprep.com/invite/ABC123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock online users
  const onlineUsers = [
    { 
      id: 1, 
      name: "Sarah T.", 
      level: "ST2", 
      lastActive: "Now", 
      status: "Available" 
    },
    { 
      id: 2, 
      name: "Michael B.", 
      level: "ST1", 
      lastActive: "2m ago", 
      status: "Available" 
    },
    { 
      id: 3, 
      name: "Aisha K.", 
      level: "ST3", 
      lastActive: "5m ago", 
      status: "In session" 
    },
    { 
      id: 4, 
      name: "John D.", 
      level: "Foundation", 
      lastActive: "Now", 
      status: "Available" 
    },
    { 
      id: 5, 
      name: "Emma W.", 
      level: "ST1", 
      lastActive: "1m ago", 
      status: "Available" 
    },
  ];

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
                  <CardTitle>Available Community Members</CardTitle>
                  <CardDescription>
                    Find candidates who are online and ready to practice
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {onlineUsers.map((user) => (
                      <li key={user.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{user.name}</p>
                            <div className="flex text-sm text-gray-500">
                              <span>{user.level}</span>
                              <span className="mx-2">•</span>
                              <span>{user.lastActive}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge 
                            className={`mr-3 ${
                              user.status === 'Available' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                              'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            {user.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            disabled={user.status !== 'Available'}
                            className={user.status === 'Available' ? 'bg-brand-blue' : 'bg-gray-300'}
                          >
                            Invite
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Start Practice Session</CardTitle>
                <CardDescription>
                  Choose a session type to begin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Clinical Station
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Communication Station
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <UserRound className="h-5 w-5 mr-2" />
                  Random Station
                </Button>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">What to expect:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-brand-blue" />
                      5-minute reading time
                    </li>
                    <li className="flex items-center">
                      <CalendarClock className="h-4 w-4 mr-2 text-brand-blue" />
                      8-minute station time
                    </li>
                    <li className="flex items-center">
                      <Video className="h-4 w-4 mr-2 text-brand-blue" />
                      Video call with AI transcription
                    </li>
                  </ul>
                </div>
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
