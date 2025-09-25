import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { acceptInvitation } from "@/lib/api";
import { supabase } from "@/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/supabase/AuthProvider'

interface Room {
  id: string;
  host_id: string;
  guest_id?: string | null;
  datetime_utc: string;
  private?: boolean;
  room_url?: string | null;
}

const InviteAcceptPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      setError(null);
      // Get current user
      if (!user) {
        setError("You must be logged in to accept an invite.");
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);
      // Fetch room from Supabase
      const { data, error } = await supabase
        .from("practice_rooms")
        .select("id, host_id, guest_id, datetime_utc, private, room_url")
        .eq("id", roomId)
        .single();
      if (error || !data) {
        setError("Room not found or you do not have access.");
        setLoading(false);
        return;
      }
      setRoom(data);
      setLoading(false);
    };
    fetchRoom();
  }, [roomId, user?.id]);

  const handleAccept = async () => {
    if (!roomId || !currentUserId) return;
    setAccepting(true);
    try {
      await acceptInvitation({ roomId: roomId, guestId: currentUserId });
      toast({ title: "Room accepted!" });
      // If the room has a room_url, send the user straight to the interview room
      if (room?.room_url) {
        navigate(`/interview-practice-room?roomUrl=${encodeURIComponent(room.room_url)}&roomId=${roomId}`);
      } else {
        navigate("/interview-scheduling");
      }
    } catch (err: any) {
      toast({ title: "Failed to accept room.", description: err?.message || "" });
      setAccepting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!room) return null;

  const isHost = currentUserId === room.host_id;
  const isGuest = currentUserId === room.guest_id;

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Private Room Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
          <div className="font-semibold">Date & Time:</div>
            <div>{new Date(room.datetime_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
          {isHost && <div className="text-accent mb-2">You are the host of this room.</div>}
          {isGuest && <div className="text-green-600 mb-2">You have already accepted this room.</div>}
          {!isHost && !isGuest && (
            <Button className="w-full bg-primary" onClick={handleAccept} disabled={accepting}>
              {accepting ? "Accepting..." : "Accept Room"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAcceptPage;