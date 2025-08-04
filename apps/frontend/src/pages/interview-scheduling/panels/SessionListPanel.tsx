import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Session {
  id: string;
  host_id: string;
  guest_id?: string | null;
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
  datetime_utc: string;
}

interface Props {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  onAccept: (sessionId: string) => void;
  onJoin: (session: Session) => void;
}

const SessionListPanel: React.FC<Props> = ({
  sessions,
  loading,
  error,
  currentUserId,
  onAccept,
  onJoin,
}) => {
  // Helper to get profile info
  const getProfile = (session: Session) => {
    let profile = session.profiles;
    if (Array.isArray(profile)) profile = profile[0];
    const name = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
      : 'Unknown';
    const avatar = profile?.avatar || (name ? name[0] : 'U');
    return { name, avatar };
  };

  // Available sessions (not joined by user)
  const availableSessions = sessions.filter(
    (session) =>
      !currentUserId ||
      (session.host_id !== currentUserId && session.guest_id !== currentUserId)
  );

  // My sessions (joined or hosted by user)
  const mySessions = sessions.filter(
    (session) =>
      currentUserId &&
      (session.host_id === currentUserId || session.guest_id === currentUserId)
  );

  return (
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
          ) : availableSessions.length === 0 ? (
            <li className="p-4 text-gray-500 text-center">No available sessions.</li>
          ) : (
            availableSessions.map((session) => {
              const { name, avatar } = getProfile(session);
              const isGuestPresent = !!session.guest_id;
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
                        <span>{
                          new Date(session.datetime_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        }</span>
                        {isGuestPresent && <span className="ml-2 text-green-600">Guest Joined</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="bg-brand-blue" onClick={() => onAccept(session.id)} disabled={isGuestPresent}>
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
          ) : mySessions.length === 0 ? (
            <li className="p-4 text-gray-500 text-center">You have no upcoming interviews.</li>
          ) : (
            mySessions.map((session) => {
              const { name, avatar } = getProfile(session);
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
                        <span>{
                          new Date(session.datetime_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        }</span>
                      </div>
                    </div>
                  </div>
                  {session.room_url ? (
                    <Button
                      className="bg-brand-blue"
                      onClick={() => onJoin(session)}
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
  );
};

export default SessionListPanel;
