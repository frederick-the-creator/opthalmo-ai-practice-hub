import { useState, useEffect } from "react";
import { useAuth } from "@/supabase/AuthProvider";
import { createRoom, setRoomGuest, rescheduleRoom } from "@/lib/api";
import { fetchAllRooms, subscribeToAllPracticeRooms } from "@/supabase/data";
import { mapApiError } from "@/lib/utils";
import type { PracticeRoomWithProfiles } from "@/types";


export interface UseInterviewSchedulingResult {
  rooms: PracticeRoomWithProfiles[];
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
  handleReschedule: (roomId: string, newDate: Date, newTime: string) => Promise<void>;
  handleCopyLink: () => void;
  copied: boolean;
  isPrivate: boolean;
  setIsPrivate: (val: boolean) => void;
}

export function useInterviewScheduling(): UseInterviewSchedulingResult {
  // State declarations
  const [rooms, setRooms] = useState<PracticeRoomWithProfiles[]>([]);
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
    const cleanup = subscribeToAllPracticeRooms({
      onChange: ({ event }) => {
        // For INSERT/UPDATE/DELETE, refresh list to pick up joined profiles
        if (event === 'INSERT' || event === 'UPDATE' || event === 'DELETE') {
          fetchRooms();
        }
      }
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
      await setRoomGuest({ roomId, guestId: user.id });
      setLoading(false);
      // No need to refetch, realtime will update
    } catch (err: any) {
      const { title, description } = mapApiError(err, 'booking');
      setError(title + (description ? ": " + description : ""));
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
      const response = await createRoom({
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

  // Handle rescheduling an existing room (host only)
  const handleReschedule = async (roomId: string, newDate: Date, newTime: string) => {
    if (!user) {
      setError("You must be logged in to reschedule a room.");
      return;
    }
    try {
      const [hours, minutes] = newTime.split(":").map(Number);
      const updatedLocal = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        hours,
        minutes,
        0,
        0
      );
      const datetimeUtc = updatedLocal.toISOString();

      // Optimistic update: update local list first
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, datetimeUtc } : r));

      await rescheduleRoom({ roomId, datetimeUtc });
      // Realtime will also sync; if backend rejects, we revert below
    } catch (err: any) {
      const { title, description } = mapApiError(err, 'reschedule');
      setError(title + (description ? ": " + description : ""));
      // Revert by refetching
      await fetchRooms();
    }
  };


  // Helper to fetch rooms
  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllRooms();
      // Filter out rooms that are more than 1 hour past start time
      const now = new Date();
      const filtered = (data as PracticeRoomWithProfiles[]).filter((room) => {
        const roomStart = new Date(room.datetimeUtc as string);
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
    handleReschedule,
    handleCopyLink,
    copied,
    isPrivate,
    setIsPrivate,
  };
}
