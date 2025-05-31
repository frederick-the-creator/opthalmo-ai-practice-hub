import React, { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { createSession } from "@/lib/api";

// Types for session and profile
interface Session {
  id: string;
  host_id: string;
  guest_id?: string | null;
  date: string;
  time: string;
  type: string;
  created_at: string;
  room_url?: string | null;
  profiles?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
  } | null | Array<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
  }>;
}

const InterviewPractice: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  
  // State for sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for scheduling form
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // State for current user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user and sessions from Supabase
  useEffect(() => {
    const fetchUserAndSessions = async () => {
      setLoading(true);
      setError(null);
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("You must be logged in to view sessions.");
        setLoading(false);
        return;
      }
      setCurrentUserId(userData.user.id);
      // Fetch sessions
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('id, host_id, guest_id, date, time, type, created_at, room_url, profiles:profiles!practice_sessions_host_id_fkey(user_id, first_name, last_name, avatar)')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) {
        setError("Failed to load sessions");
        setLoading(false);
        return;
      }
      // Filter out sessions that are more than 1 hour past start time
      const now = new Date();
      const filtered = (data as Session[]).filter((session) => {
        const sessionStart = new Date(`${session.date}T${session.time}`);
        return now < new Date(sessionStart.getTime() + 60 * 60 * 1000);
      });
      setSessions(filtered);
      setLoading(false);
    };
    fetchUserAndSessions();
  }, []);

  // Accept Invitation handler
  const handleAcceptInvitation = async (sessionId: string) => {
    if (!currentUserId) {
      console.log('No current user ID, cannot accept invitation.');
      setError("You must be logged in to accept an invitation.");
      return;
    }
    setLoading(true);
    setError(null);
    console.log('Attempting to accept invitation for session:', sessionId, 'as user:', currentUserId);
    const { error } = await supabase
      .from('practice_sessions')
      .update({ guest_id: currentUserId })
      .eq('id', sessionId);
    if (error) {
      console.error('Supabase update error:', error);
      setError("Failed to accept invitation: " + error.message);
      setLoading(false);
      return;
    }
    // Refetch sessions
    const { data, error: fetchError } = await supabase
      .from('practice_sessions')
      .select('id, host_id, guest_id, date, time, type, created_at, profiles:profiles!practice_sessions_host_id_fkey(user_id, first_name, last_name, avatar)')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (fetchError) {
      console.error('Supabase fetch error after update:', fetchError);
      setError("Failed to reload sessions: " + fetchError.message);
      setLoading(false);
      return;
    }
    if (data) {
      const now = new Date();
      const filtered = (data as Session[]).filter((session) => {
        const sessionStart = new Date(`${session.date}T${session.time}`);
        return now < new Date(sessionStart.getTime() + 60 * 60 * 1000);
      });
      setSessions(filtered);
    }
    setLoading(false);
  };

  // Handle scheduling a new session
  const handleScheduleSession = async () => {
    setScheduleError(null);
    if (!selectedDate || !selectedTime || !sessionType) {
      setScheduleError("Please select date, time, and session type.");
      return;
    }
    setScheduling(true);
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setScheduleError("You must be logged in to schedule a session.");
      setScheduling(false);
      return;
    }
    const host_id = userData.user.id;
    try {
      // Call backend to create session (creates Daily room and DB row)
      const response = await createSession({
        host_id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        type: sessionType,
      });
      if (response.error) {
        setScheduleError(response.error || "Failed to schedule session.");
        setScheduling(false);
        return;
      }
      // Success: refetch sessions
      setSelectedDate(undefined);
      setSelectedTime("");
      setSessionType("");
      setScheduling(false);
      setLoading(true);
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('id, host_id, guest_id, date, time, type, created_at, room_url, profiles:profiles!practice_sessions_host_id_fkey(user_id, first_name, last_name, avatar)')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (!error && data) {
        const now = new Date();
        const filtered = (data as Session[]).filter((session) => {
          const sessionStart = new Date(`${session.date}T${session.time}`);
          return now < new Date(sessionStart.getTime() + 60 * 60 * 1000);
        });
        setSessions(filtered);
      }
      setLoading(false);
    } catch (err: any) {
      setScheduleError("Failed to schedule session.");
      setScheduling(false);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://ophthalmoprep.com/invite/ABC123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Interview Practice</h1>
          <p className="text-gray-600">Practice clinical and communication stations</p>
        </div>
        <div className="mt-4 md:mt-0">
          {/* <Button className="bg-brand-blue text-white" onClick={() => navigate('/interview-practice-room')}>
            Start Practice
          </Button> */}
        </div>
      </div>

      <Tabs defaultValue="community" className="mb-8">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="community">
            <Users className="mr-2 h-4 w-4" />
            Community Match
          </TabsTrigger>
          {/* <TabsTrigger value="direct">
            <LinkIcon className="mr-2 h-4 w-4" />
            Direct Invite
          </TabsTrigger> */}
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
                        {loading ? (
                          <li className="p-4 text-gray-500 text-center">Loading...</li>
                        ) : error ? (
                          <li className="p-4 text-red-500 text-center">{error}</li>
                        ) : sessions.length === 0 ? (
                          <li className="p-4 text-gray-500 text-center">No available sessions.</li>
                        ) : (
                          sessions.map((session) => {
                            let profile = session.profiles;
                            if (Array.isArray(profile)) profile = profile[0];
                            const name = profile
                              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
                              : 'Unknown';
                            const avatar = profile?.avatar || (name ? name[0] : 'U');
                            // Show guest info if present
                            const isGuestPresent = !!session.guest_id;
                            const isUserGuestOrHost = currentUserId && (session.host_id === currentUserId || session.guest_id === currentUserId);
                            return (
                              <li key={session.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center">
                                  <Avatar>
                                    <AvatarFallback>{avatar}</AvatarFallback>
                                  </Avatar>
                                  <div className="ml-3">
                                    <p className="font-medium">{name}</p>
                                    <div className="flex text-sm text-gray-500">
                                      <span>{session.type}</span>
                                      <span className="mx-2">•</span>
                                      <span>{new Date(session.date + 'T' + session.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                      {isGuestPresent && <span className="ml-2 text-green-600">Guest Joined</span>}
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" className="bg-brand-blue" onClick={() => handleAcceptInvitation(session.id)} disabled={isGuestPresent || isUserGuestOrHost}>
                                  {isGuestPresent ? "Accepted" : "Accept Invitation"}
                                </Button>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </TabsContent>
                    <TabsContent value="my">
                      <ul className="divide-y">
                        {loading ? (
                          <li className="p-4 text-gray-500 text-center">Loading...</li>
                        ) : error ? (
                          <li className="p-4 text-red-500 text-center">{error}</li>
                        ) : sessions.filter(session => currentUserId && (session.host_id === currentUserId || session.guest_id === currentUserId)).length === 0 ? (
                          <li className="p-4 text-gray-500 text-center">You have no upcoming interviews.</li>
                        ) : (
                          sessions.filter(session => currentUserId && (session.host_id === currentUserId || session.guest_id === currentUserId)).map((session) => {
                            let profile = session.profiles;
                            if (Array.isArray(profile)) profile = profile[0];
                            const name = profile
                              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
                              : 'Unknown';
                            const avatar = profile?.avatar || (name ? name[0] : 'U');
                            return (
                              <li key={session.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center">
                                  <Avatar>
                                    <AvatarFallback>{avatar}</AvatarFallback>
                                  </Avatar>
                                  <div className="ml-3">
                                    <p className="font-medium">{name}</p>
                                    <div className="flex text-sm text-gray-500">
                                      <span>{session.type}</span>
                                      <span className="mx-2">•</span>
                                      <span>{new Date(session.date + 'T' + session.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </div>
                                  </div>
                                </div>
                                {session.room_url ? (
                                  <Button
                                    className="bg-brand-blue"
                                    onClick={() => navigate(`/interview-practice-room?roomUrl=${encodeURIComponent(session.room_url)}&sessionId=${session.id}`)}
                                  >
                                    Join
                                  </Button>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800">Upcoming</Badge>
                                )}
                              </li>
                            );
                          })
                        )}
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
                {scheduleError && <div className="text-red-500 text-sm">{scheduleError}</div>}
                <Button className="w-full bg-brand-blue" onClick={handleScheduleSession} disabled={scheduling}>
                  {scheduling ? "Scheduling..." : "Schedule Session"}
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
