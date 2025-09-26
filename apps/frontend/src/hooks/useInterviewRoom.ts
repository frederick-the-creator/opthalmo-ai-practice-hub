import { useState, useEffect, useMemo } from 'react';
import { fetchRooms,  fetchRoundByRoomAndRoundNumber, subscribeToPracticeRoom, subscribeToPracticeRoundsByRoomId, fetchCaseBriefs } from '@/supabase/data';
import { useAuth } from '@/supabase/AuthProvider';
import { setRoundCandidate, setRoundCase, setStage } from "@/lib/api";

// Define the return type for clarity (can be expanded later)
interface UseInterviewRoomResult {
  room: any; // TODO: type this properly
  round:  any;
  isHost: boolean;
  isCandidate: boolean;
  updateStage: (nextStage: string) => Promise<void>;
  setCase: (roundId: string, caseBriefId: string) => Promise<void>;
  setCandidate: (roundId: string, userId: string) => Promise<void>;
  roundNumber: number;
  setRoundNumber: any;
  error: string | null;
  caseBriefs: any[];
}


export function useInterviewRoom(roomId: string | null): UseInterviewRoomResult {
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [round, setRound] = useState<any>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [caseBriefs, setCaseBriefs] = useState<any[]>([]);

  // Derive flags for current user (host, candidate)
  let isHost = false;
  let isCandidate = false;
  if (user?.id && room) {
    if (user?.id === room.host_id) isHost = true;
    if (user?.id === (round?.candidate_id)) isCandidate = true;
  }

  // Initial fetch of room and round from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const roomResult = roomId ? await fetchRooms(roomId) : null;
        const roundResult = roomId ? await fetchRoundByRoomAndRoundNumber(roomId, roundNumber) : null;
        if (isMounted) setRoom(roomResult);
        if (isMounted) setRound(roundResult);
      } catch (err: any) {
        if (isMounted) setError('Failed to fetch room');
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [roomId, roundNumber]);

  // Load all case briefs once
  useEffect(() => {
    let isMounted = true;
    fetchCaseBriefs().then(fetched => {
      if (!isMounted) return;
      setCaseBriefs(fetched ?? []);
    }).catch(() => {
      // Non-blocking; keep empty list on failure
    });
    return () => { isMounted = false; };
  }, []);

  // Sort case briefs deterministically, memoized
  const sortedCaseBriefs = useMemo(() => {
    const copy = Array.isArray(caseBriefs) ? [...caseBriefs] : [];
    copy.sort((a: any, b: any) => {
      const aName = (a?.case_name ?? '').toString();
      const bName = (b?.case_name ?? '').toString();
      const cmp = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      const aId = (a?.id ?? '').toString();
      const bId = (b?.id ?? '').toString();
      return aId.localeCompare(bId);
    });
    return copy;
  }, [caseBriefs]);

  // // Set up Realtime subscription so room can react to changes in the DB by the other user.
  useEffect(() => {
    if (!roomId) return;
    const cleanup = subscribeToPracticeRoom({
      roomId,
      onChange: async () => {
        try {
          const result = await fetchRooms(roomId);
          setRoom(result);
        } catch (err) {
          setError('Failed to update room from realtime');
        }
      }
    });
    return cleanup;
  }, [roomId]);

  // Subscribe to any round changes for this room so guest gets updates instantly
  useEffect(() => {
    if (!roomId) return;
    const cleanup = subscribeToPracticeRoundsByRoomId({
      roomId,
      onChange: async () => {
        try {
          const result = await fetchRoundByRoomAndRoundNumber(roomId, roundNumber);
          setRound(result);
        } catch (err) {
          setError('Failed to update round from realtime');
        }
      }
    });
    return cleanup;
  }, [roomId, roundNumber]);



  // Helper: updateStage
  const updateStage = async (nextStage: string) => {
    setError(null);
    if (!roomId || !room) {
      setError('No room loaded');
      return Promise.reject('No room loaded');
    }
    try {
      await setStage({ roomId, stage: nextStage });
      // Ensure local state reflects the latest server value immediately
      // rather than relying solely on realtime subscription latency.
      const updatedRoom = await fetchRooms(roomId);
      if (updatedRoom) {
        setRoom(updatedRoom as any);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update stage');
      return Promise.reject(err?.response?.data?.error || 'Failed to update stage');
    }
  };

  // Helper: setRound
  const setCase = async (roundId: string, caseBriefId: string) => {
    setError(null);
    if (!roomId || !room) {
      setError('No room loaded');
      return Promise.reject('No room loaded');
    }
    try {
      await setRoundCase({ roundId, caseBriefId });
      const roundResult = await fetchRoundByRoomAndRoundNumber(roomId, roundNumber);
      await setRound(roundResult);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to set case');
      return Promise.reject(err?.response?.data?.error || 'Failed to set case');
    }
  };

  // Helper: setCandidate
  const setCandidate = async (roundId: string, candidateId: string) => {
    setError(null);
    if (!roomId || !room) {
      setError('No room loaded');
      return Promise.reject('No room loaded');
    }
    try {
      await setRoundCandidate({ roundId, candidateId });
      const roundResult = await fetchRoundByRoomAndRoundNumber(roomId, roundNumber);
      await setRound(roundResult);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to set candidate');
      return Promise.reject(err?.response?.data?.error || 'Failed to set candidate');
    }
  };

  return {
    room,
    round,
    isHost,
    isCandidate,
    updateStage,
    setCase,
    setCandidate,
    roundNumber,
    setRoundNumber,
    error,
    caseBriefs: sortedCaseBriefs,
  };
} 