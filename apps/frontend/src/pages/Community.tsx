
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, UserPlus, MessageCircle, Clock, Video, Calendar } from "lucide-react";

const Community: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock community members
  const communityMembers = [
    {
      id: 1,
      name: "Sarah Thomas",
      role: "ST2 Ophthalmology",
      location: "London",
      interests: ["Glaucoma", "Medical Education"],
      availability: "Available now",
      status: "online",
      lastActive: "Now",
      profileComplete: true
    },
    {
      id: 2,
      name: "Michael Brown",
      role: "ST1 Ophthalmology",
      location: "Manchester",
      interests: ["Retinal Disorders", "Research"],
      availability: "Available today",
      status: "online",
      lastActive: "2m ago",
      profileComplete: true
    },
    {
      id: 3,
      name: "Aisha Khan",
      role: "ST3 Ophthalmology",
      location: "Birmingham",
      interests: ["Pediatric Ophthalmology", "Clinical Skills"],
      availability: "Available weekends",
      status: "offline",
      lastActive: "3h ago",
      profileComplete: true
    },
    {
      id: 4,
      name: "John Davis",
      role: "Foundation Doctor",
      location: "Edinburgh",
      interests: ["Interview Preparation", "Career Advice"],
      availability: "Available evenings",
      status: "offline",
      lastActive: "1d ago",
      profileComplete: false
    },
    {
      id: 5,
      name: "Emma Wilson",
      role: "ST1 Ophthalmology",
      location: "Bristol",
      interests: ["Anterior Segment", "Communication Skills"],
      availability: "Available now",
      status: "online",
      lastActive: "10m ago",
      profileComplete: true
    },
    {
      id: 6,
      name: "Rajan Patel",
      role: "ST2 Ophthalmology",
      location: "Leicester",
      interests: ["Surgical Skills", "Glaucoma"],
      availability: "Available weekends",
      status: "offline",
      lastActive: "2d ago",
      profileComplete: true
    }
  ];

  // Filter members based on search
  const filteredMembers = communityMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Mock upcoming sessions
  const upcomingSessions = [
    {
      id: 1,
      title: "Clinical Station Practice",
      with: "Michael Brown",
      time: "Today, 7:00 PM",
      type: "One-on-one"
    },
    {
      id: 2,
      title: "Communication Skills Group",
      with: "Sarah Thomas + 2 others",
      time: "Tomorrow, 6:30 PM",
      type: "Group Session"
    }
  ];

  // Mock activity feed
  const activityFeed = [
    {
      id: 1,
      user: "Sarah Thomas",
      action: "completed a session",
      target: "Clinical Assessment Station",
      time: "2 hours ago"
    },
    {
      id: 2,
      user: "Aisha Khan",
      action: "shared a resource",
      target: "NICE Guidelines Summary",
      time: "Yesterday"
    },
    {
      id: 3,
      user: "Michael Brown",
      action: "is looking for a practice partner",
      target: "Communication Skills",
      time: "Yesterday"
    }
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-gray-600">Connect with other candidates for practice and support</p>
        </div>

        <div className="mt-4 md:mt-0 relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search community..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Members</TabsTrigger>
              <TabsTrigger value="available">Available Now</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {filteredMembers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-4 text-lg font-medium text-gray-900">No members found</h2>
              <p className="mt-2 text-gray-500">Try adjusting your search query</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 relative ${
                          member.status === 'online' ? 'border-2 border-green-500' : ''
                        }`}>
                          {member.name.charAt(0)}
                          {member.status === 'online' && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <Badge className={member.status === 'online' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                        {member.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 text-sm">
                    <div className="flex items-center text-gray-500 mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Last active: {member.lastActive}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-700 font-medium">Interests: </span>
                      <span className="text-gray-600">{member.interests.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Availability: </span>
                      <span className="text-gray-600">{member.availability}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t flex justify-between pt-3 pb-3">
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button size="sm" className="bg-brand-blue">
                      <Video className="h-4 w-4 mr-1" />
                      Invite to Practice
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Button variant="outline" className="mt-4">Load More</Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-brand-blue" />
                Upcoming Practice Sessions
              </CardTitle>
              <CardDescription>Your scheduled practice sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingSessions.length > 0 ? (
                <ul className="divide-y">
                  {upcomingSessions.map((session) => (
                    <li key={session.id} className="p-4">
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-gray-500">With: {session.with}</p>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline">{session.type}</Badge>
                        <span className="text-sm font-medium text-brand-blue">{session.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No upcoming sessions</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 border-t">
              <Button className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Practice Session
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-brand-purple" />
                Community Activity
              </CardTitle>
              <CardDescription>Recent activity from community members</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {activityFeed.map((activity) => (
                  <li key={activity.id} className="p-4">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-gray-600">{activity.action}</span>{" "}
                      <span className="font-medium text-brand-blue">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t">
              <Button variant="link" className="text-brand-purple w-full">
                View All Activity
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-brand-green" />
                Find Practice Partners
              </CardTitle>
              <CardDescription>Filter by interests and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1.5">Interests</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Glaucoma</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Retina</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Communication</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">+ Add</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1.5">Training Level</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Foundation</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">ST1-ST2</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">ST3+</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1.5">Availability</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Now</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Today</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">This Week</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3">
              <Button className="w-full bg-brand-green">
                Apply Filters
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Community;
