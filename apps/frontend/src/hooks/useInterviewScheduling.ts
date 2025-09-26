import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/supabase/AuthProvider";
import { createPracticeRoom, acceptInvitation } from "@/lib/api";
import { fetchRooms as fetchRoomsUtil, subscribeToPracticeRoom } from "@/supabase/data";

// Types for room and profile
export interface Room {
  id: string;
  host_id: string;
  guest_id?: string | null;
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
  stage?: string | null;
}

export interface UseInterviewSchedulingResult {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  scheduling: boolean;
  scheduleError: string | null;
  handleAcceptInvitation: (roomId: string) => Promise<void>;
  handleScheduleRoom: () => Promise<void>;
  handleCopyLink: () => void;
  copied: boolean;
  isPrivate: boolean;
  setIsPrivate: (val: boolean) => void;
}

export function useInterviewScheduling(): UseInterviewSchedulingResult {
  // State declarations
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);


  // Initial fetch of user and rooms
  useEffect(() => {
    let isMounted = true;
    const fetchUserAndRooms = async () => {
      setLoading(true);
      setError(null);
      if (!user) {
        if (!isMounted) return;
        setError("You must be logged in to view rooms.");
        setLoading(false);
        return;
      }
      await fetchRooms();
    };
    fetchUserAndRooms();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Realtime subscription to rooms table
  useEffect(() => {
    const cleanup = subscribeToPracticeRoom({
      onChange: fetchRooms
    });
    return cleanup;
  }, []);

  // Accept Invitation handler
  const handleAcceptInvitation = async (roomId: string) => {
    if (!user?.id) {
      setError("You must be logged in to accept an invitation.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await acceptInvitation({ roomId, guestId: user.id });
      setLoading(false);
      // No need to refetch, realtime will update
    } catch (err: any) {
      setError("Failed to accept invitation: " + (err?.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  // Handle scheduling a new room
  const handleScheduleRoom = async () => {
    setScheduleError(null);
    if (!selectedDate || !selectedTime) {
      setScheduleError("Please select date and time.");
      return;
    }
    setScheduling(true);
    // Get current user
    if (!user) {
      setScheduleError("You must be logged in to schedule a room.");
      setScheduling(false);
      return;
    }
    const hostId = user.id;
    try {
      // Debug logs for timezone issue
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth(); // 0-based
      const day = selectedDate.getDate();
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const localDateTime = new Date(year, month, day, hours, minutes, 0, 0);
      const datetimeUtc = localDateTime.toISOString();
      // Call backend to create room (creates Daily room and DB row)
      const response = await createPracticeRoom({
        hostId,
        datetimeUtc,
        private: isPrivate,
      });
      if (response.error) {
        setScheduleError(response.error || "Failed to schedule room.");
        setScheduling(false);
        return;
      }
      // Success: reset form
      setSelectedDate(undefined);
      setSelectedTime("12:00");
      setIsPrivate(false);
      setScheduling(false);
      // No need to refetch, realtime will update
    } catch (err: any) {
      setScheduleError("Failed to schedule room.");
      setScheduling(false);
    }
  };


  // Helper to fetch rooms
  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoomsUtil();
      // Filter out rooms that are more than 1 hour past start time
      const now = new Date();
      const filtered = (data as any[]).filter((room) => {
        const roomStart = new Date(room.datetime_utc);
        return now < new Date(roomStart.getTime() + 60 * 60 * 1000);
      });
      setRooms(filtered);
      setLoading(false);
    } catch (err) {
      setError("Failed to load rooms");
      setLoading(false);
    }
  };

  // Handle copying invite link
  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://ophthalmoprep.com/invite/ABC123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    rooms,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    scheduling,
    scheduleError,
    handleAcceptInvitation,
    handleScheduleRoom,
    handleCopyLink,
    copied,
    isPrivate,
    setIsPrivate,
  };
}
