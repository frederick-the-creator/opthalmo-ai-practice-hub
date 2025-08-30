import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface Session {
  id: string;
  host_id: string;
  guest_id?: string | null;
  type: string;
  created_at: string;
  room_url?: string | null;
  host_profile?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
  } | null;
  guest_profile?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
  } | null;
  datetime_utc: string;
  private?: boolean;
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
  // Helper to get host and guest profile info
  const getHostAndGuestProfiles = (session: Session, currentUserId: string | null) => {
    const hostProfile = session.host_profile || null;
    const guestProfile = session.guest_profile || null;
    const hostName = hostProfile ? `${hostProfile.first_name || ''} ${hostProfile.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
    let guestName: string;
    if (guestProfile) {
      if (currentUserId && session.guest_id === currentUserId) {
        guestName = 'You';
      } else {
        guestName = `${guestProfile.first_name || ''} ${guestProfile.last_name || ''}`.trim() || 'Unknown';
      }
    } else {
      guestName = 'No Guest';
    }
    const hostAvatar = hostProfile?.avatar || (hostName ? hostName[0] : 'U');
    return { hostName, guestName, hostAvatar };
  };

  // Available sessions (not joined by user) and only public
  const availableSessions = sessions.filter(
    (session) =>
      (!currentUserId || (session.host_id !== currentUserId && session.guest_id !== currentUserId)) &&
      session.private !== true
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
              const { hostName, guestName, hostAvatar } = getHostAndGuestProfiles(session, currentUserId);
              const isGuestPresent = !!session.guest_id;
              return (
                <li key={session.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarFallback>{hostAvatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium">{hostName}</p>
                      <p className="text-sm text-gray-600">Guest: {guestName}</p>
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
                  <Button size="sm" className="bg-primary" onClick={() => onAccept(session.id)} disabled={isGuestPresent}>
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
              const { hostName, guestName, hostAvatar } = getHostAndGuestProfiles(session, currentUserId);
              const isHost = currentUserId && session.host_id === currentUserId;
              return (
                <li key={session.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarFallback>{hostAvatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium flex items-center gap-2">
                        {hostName}
                        {session.private && (
                          <Badge className="bg-gray-200 text-gray-700 ml-2">Private</Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Guest: {guestName}</p>
                      <div className="flex text-sm text-gray-500">
                        <span>{session.type}</span>
                        <span className="mx-2">•</span>
                        <span>{
                          new Date(session.datetime_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        }</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.private && isHost && session.room_url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-gray-300"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/invite/' + session.id);
                          toast({ title: 'Invite link copied!' });
                        }}
                      >
                        Invite Link
                      </Button>
                    )}
                    {session.room_url ? (
                      <Button
                        className={`bg-primary${!session.guest_id ? ' opacity-50 cursor-pointer' : ''}`}
                        aria-label={!session.guest_id ? 'Waiting for guest' : 'Join session'}
                        title={!session.guest_id ? 'Waiting for guest to accept session' : 'Join session'}
                        onClick={() => onJoin(session)}
                      >
                        Join
                      </Button>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Upcoming</Badge>
                    )}
                  </div>
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
