import { useAuth } from "@/supabase/AuthProvider";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import type { PracticeRoomWithProfiles } from "@/types";

interface Props {
  rooms: PracticeRoomWithProfiles[];
  loading: boolean;
  error: string | null;
  onAccept: (roomId: string) => void;
  onJoin: (room: PracticeRoomWithProfiles) => void;
}

const RoomListPanel: React.FC<Props> = ({
  rooms,
  loading,
  error,
  onAccept,
  onJoin,
}) => {
  const { user } = useAuth();
  // Helper to get host and guest profile info
  const getHostAndGuestProfiles = (room: PracticeRoomWithProfiles, currentUserId: string | null) => {
    const hostProfile = room.host_profile || null;
    const guestProfile = room.guest_profile || null;
    const hostName = hostProfile ? `${hostProfile.firstName || ''} ${hostProfile.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    let guestName: string;
    if (guestProfile) {
      if (currentUserId && room.guestId === currentUserId) {
        guestName = 'You';
      } else {
        guestName = `${guestProfile.firstName || ''} ${guestProfile.lastName || ''}`.trim() || 'Unknown';
      }
    } else {
      guestName = 'No Guest';
    }
    const hostAvatar = hostProfile?.avatar || (hostName ? hostName[0] : 'U');
    return { hostName, guestName, hostAvatar };
  };

  // Available rooms (not joined by user) and only public
  const availablerooms = rooms.filter(
    (room) =>
      (!user?.id || (room.hostId !== user.id && room.guestId !== user.id)) &&
      room.private !== true
  );

  // My rooms (joined or hosted by user)
  const myrooms = rooms.filter(
    (room) =>
      user?.id &&
      (room.hostId === user.id || room.guestId === user.id)
  );

  return (
    <Tabs defaultValue="schedule" className="p-0">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="schedule">Available rooms</TabsTrigger>
        <TabsTrigger value="my">My Upcoming rooms</TabsTrigger>
      </TabsList>
      <TabsContent value="schedule">
        <ul className="divide-y">
          {loading ? (
            <li className="p-4 text-gray-500 text-center">Loading...</li>
          ) : error ? (
            <li className="p-4 text-red-500 text-center">{error}</li>
          ) : availablerooms.length === 0 ? (
            <li className="p-4 text-gray-500 text-center">No available rooms.</li>
          ) : (
            availablerooms.map((room) => {
              const { hostName, guestName, hostAvatar } = getHostAndGuestProfiles(room, user?.id ?? null);
              const isGuestPresent = !!room.guestId;
              return (
                <li key={room.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarFallback>{hostAvatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium">{hostName}</p>
                      <p className="text-sm text-gray-600">Guest: {guestName}</p>
                      <div className="flex text-sm text-gray-500">
                        <span>{
                          new Date(room.datetimeUtc as string).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        }</span>
                        {isGuestPresent && <span className="ml-2 text-green-600">Guest Joined</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="bg-primary" onClick={() => onAccept(room.id)} disabled={isGuestPresent}>
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
          ) : myrooms.length === 0 ? (
            <li className="p-4 text-gray-500 text-center">You have no upcoming interviews.</li>
          ) : (
            myrooms.map((room) => {
              const { hostName, guestName, hostAvatar } = getHostAndGuestProfiles(room, user?.id ?? null);
              const isHost = user?.id && room.hostId === user.id;
              return (
                <li key={room.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarFallback>{hostAvatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium flex items-center gap-2">
                        {hostName}
                        {room.private && (
                          <Badge className="bg-gray-200 text-gray-700 ml-2">Private</Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Guest: {guestName}</p>
                      <div className="flex text-sm text-gray-500">
                        <span>{
                          new Date(room.datetimeUtc as string).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        }</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.private && isHost && room.roomUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-gray-300"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/invite/' + room.id);
                          toast({ title: 'Invite link copied!' });
                        }}
                      >
                        Invite Link
                      </Button>
                    )}
                    {room.roomUrl ? (
                      <Button
                        className={`bg-primary${!room.guestId ? ' opacity-50 cursor-pointer' : ''}${room.stage === 'Finished' ? ' opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={
                          room.stage === 'Finished'
                            ? 'Interview finished'
                            : (!room.guestId ? 'Waiting for guest' : 'Join room')
                        }
                        title={
                          room.stage === 'Finished'
                            ? 'This interview is finished'
                            : (!room.guestId ? 'Waiting for guest to accept room' : 'Join room')
                        }
                        disabled={room.stage === 'Finished'}
                        onClick={() => onJoin(room)}
                      >
                        {room.stage === 'Finished' ? 'Finished' : 'Join'}
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

export default RoomListPanel;
