import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { createSession, acceptInvitation } from "@/lib/api";
import { fetchSessions as fetchSessionsUtil, subscribeToPracticeSessions } from "@/supabase/utils";

// Types for session and profile
export interface Session {
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

export interface UseInterviewSchedulingResult {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  sessionType: string;
  setSessionType: (type: string) => void;
  scheduling: boolean;
  scheduleError: string | null;
  handleAcceptInvitation: (sessionId: string) => Promise<void>;
  handleScheduleSession: () => Promise<void>;
  handleCopyLink: () => void;
  copied: boolean;
}

export function useInterviewScheduling(): UseInterviewSchedulingResult {
  // State declarations
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);


  // Initial fetch of user and sessions
  useEffect(() => {
    let isMounted = true;
    const fetchUserAndSessions = async () => {
      setLoading(true);
      setError(null);
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (userError || !userData.user) {
        setError("You must be logged in to view sessions.");
        setLoading(false);
        return;
      }
      setCurrentUserId(userData.user.id);
      await fetchSessions();
    };
    fetchUserAndSessions();
    return () => { isMounted = false; };
  }, []);

  // Realtime subscription to sessions table
  useEffect(() => {
    const cleanup = subscribeToPracticeSessions({
      onChange: fetchSessions
    });
    return cleanup;
  }, []);

  // Accept Invitation handler
  const handleAcceptInvitation = async (sessionId: string) => {
    if (!currentUserId) {
      setError("You must be logged in to accept an invitation.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await acceptInvitation({ sessionId, guestId: currentUserId });
      setLoading(false);
      // No need to refetch, realtime will update
    } catch (err: any) {
      setError("Failed to accept invitation: " + (err?.response?.data?.error || err.message));
      setLoading(false);
    }
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
      // Combine selectedDate and selectedTime into a UTC ISO string
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const localDateTime = new Date(selectedDate);
      localDateTime.setHours(hours, minutes, 0, 0);
      const datetime_utc = localDateTime.toISOString();
      // Call backend to create session (creates Daily room and DB row)
      const response = await createSession({
        host_id,
        date: selectedDate.toISOString().split('T')[0], // for backward compatibility
        time: selectedTime, // for backward compatibility
        type: sessionType,
        datetime_utc, // now required
      });
      if (response.error) {
        setScheduleError(response.error || "Failed to schedule session.");
        setScheduling(false);
        return;
      }
      // Success: reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setSessionType("");
      setScheduling(false);
      // No need to refetch, realtime will update
    } catch (err: any) {
      setScheduleError("Failed to schedule session.");
      setScheduling(false);
    }
  };


  // Helper to fetch sessions
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSessionsUtil();
      // Filter out sessions that are more than 1 hour past start time
      const now = new Date();
      const filtered = (data as any[]).filter((session) => {
        const sessionStart = new Date(`${session.date}T${session.time}`);
        return now < new Date(sessionStart.getTime() + 60 * 60 * 1000);
      });
      setSessions(filtered);
      setLoading(false);
    } catch (err) {
      setError("Failed to load sessions");
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
    sessions,
    loading,
    error,
    currentUserId,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    sessionType,
    setSessionType,
    scheduling,
    scheduleError,
    handleAcceptInvitation,
    handleScheduleSession,
    handleCopyLink,
    copied,
  };
}
