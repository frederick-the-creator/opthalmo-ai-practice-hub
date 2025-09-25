import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { acceptInvitation } from "@/lib/api";
import { supabase } from "@/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Session {
  id: string;
  host_id: string;
  guest_id?: string | null;
  type: string;
  datetime_utc: string;
  private?: boolean;
  room_url?: string | null;
}

const InviteAcceptPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      setError(null);
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("You must be logged in to accept an invite.");
        setLoading(false);
        return;
      }
      setCurrentUserId(userData.user.id);
      // Fetch session from Supabase
      const { data, error } = await supabase
        .from("practice_rooms")
        .select("id, host_id, guest_id, type, datetime_utc, private, room_url")
        .eq("id", sessionId)
        .single();
      if (error || !data) {
        setError("Session not found or you do not have access.");
        setLoading(false);
        return;
      }
      setSession(data);
      setLoading(false);
    };
    fetchSession();
  }, [sessionId]);

  const handleAccept = async () => {
    if (!sessionId || !currentUserId) return;
    setAccepting(true);
    try {
      await acceptInvitation({ sessionId, guestId: currentUserId });
      toast({ title: "Session accepted!" });
      // If the session has a room_url, send the user straight to the interview room
      if (session?.room_url) {
        navigate(`/interview-practice-room?roomUrl=${encodeURIComponent(session.room_url)}&sessionId=${sessionId}`);
      } else {
        navigate("/interview-scheduling");
      }
    } catch (err: any) {
      toast({ title: "Failed to accept session.", description: err?.message || "" });
      setAccepting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!session) return null;

  const isHost = currentUserId === session.host_id;
  const isGuest = currentUserId === session.guest_id;

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Private Session Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="font-semibold">Session Type:</div>
            <div>{session.type}</div>
            <div className="font-semibold mt-2">Date & Time:</div>
            <div>{new Date(session.datetime_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
          {isHost && <div className="text-accent mb-2">You are the host of this session.</div>}
          {isGuest && <div className="text-green-600 mb-2">You have already accepted this session.</div>}
          {!isHost && !isGuest && (
            <Button className="w-full bg-primary" onClick={handleAccept} disabled={accepting}>
              {accepting ? "Accepting..." : "Accept Session"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAcceptPage;