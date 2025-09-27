import { useState, useEffect, useMemo } from 'react';
import { fetchRoom,  fetchRoundByRoomAndRoundNumber, subscribeToPracticeRoomByRoomId, subscribeToPracticeRoundsByRoomId, fetchCaseBriefs } from '@/supabase/data';
import { useAuth } from '@/supabase/AuthProvider';
import { setRoundCandidate, setRoundCase, setRoomStage as setRoomStageApi, createRound } from "@/lib/api";

// Define the return type for clarity (can be expanded later)
interface UseInterviewRoomResult {
  room: any; // TODO: type this properly
  round:  any;
  roomStage: string;
  isHost: boolean;
  isCandidate: boolean;
  updateStage: (nextStage: string) => Promise<void>;
  setCase: (roundId: string, caseBriefId: string) => Promise<void>;
  setCandidate: (roundId: string, userId: string) => Promise<void>;
  createNewRound: () => Promise<void>;
  error: string | null;
  caseBriefs: any[];
}


export function useInterviewRoom(roomId: string | null): UseInterviewRoomResult {
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [round, setRound] = useState<any>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [roomStage, setRoomStage] = useState<string>('Prep');
  const [error, setError] = useState<string | null>(null);
  const [caseBriefs, setCaseBriefs] = useState<any[]>([]);


  //////////////
  // User Logic
  /////////////

  let isHost = false;
  let isCandidate = false;
  if (user?.id && room) {
    if (user?.id === room.host_id) isHost = true;
    if (user?.id === (round?.candidate_id)) isCandidate = true;
  }

  //////////////
  // Initial fetch of Room and Round
  /////////////

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const roomResult = roomId ? await fetchRoom(roomId) : null;
        const roundResult = roomId ? await fetchRoundByRoomAndRoundNumber(roomId, roundNumber) : null;
        if (isMounted) setRoom(roomResult);
        if (isMounted) setRoomStage(roomResult.stage);
        if (isMounted) setRound(roundResult);
      } catch (err: any) {
        if (isMounted) setError('Failed to fetch room');
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, []);

  //////////////
  // Load Cases
  /////////////

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

  //////////////
  // Realtime subscriptions
  /////////////

  // // Set up Realtime subscription so room can react to changes in the DB by the other user.
  useEffect(() => {
    if (!roomId) return;
    const cleanup = subscribeToPracticeRoomByRoomId({
      roomId,
      onChange: async ({ event }) => {
        // For INSERT/UPDATE on this room, refetch to pick up joined profiles
        if (event === 'INSERT' || event === 'UPDATE') {
          try {
            const result = await fetchRoom(roomId);
            setRoom(result);
            setRoomStage(result.stage);
          } catch (err) {
            setError('Failed to update room from realtime');
          }
        }
      }
    });
    return cleanup;
  }, []);

  // Subscribe to any round changes for this room so both participants get updates instantly
  useEffect(() => {
    if (!roomId) return;
    const cleanup = subscribeToPracticeRoundsByRoomId({
      roomId,
      onChange: ({ event, new: rec }) => {
        if ((event === 'INSERT' || event === 'UPDATE') && rec) {
          setRound(rec);
          if (typeof rec.round_number === 'number') {
            setRoundNumber(rec.round_number);
          }
        }
      }
    });
    return cleanup;
  }, []);

  //////////////
  // Update Room
  /////////////

  const updateStage = async (nextStage: string) => {
    setError(null);
    if (!roomId || !room) {
      setError('No room loaded');
      return Promise.reject('No room loaded');
    }
    try {
      // optimistic update
      setRoomStage(nextStage);
      setRoom((prev: any) => prev ? { ...prev, stage: nextStage } : prev);

      const updatedRoom = await setRoomStageApi({ roomId, stage: nextStage });
      if (updatedRoom) {
        setRoom(updatedRoom as any);
        setRoomStage(updatedRoom.stage);
      }
      setError(null);
    } catch (err: any) {
      // rollback: refetch as a simple repair strategy
      try {
        const latest = await fetchRoom(roomId);
        setRoom(latest);
        setRoomStage(latest.stage);
      } catch {}
      setError(err?.response?.data?.error || 'Failed to update stage');
      return Promise.reject(err?.response?.data?.error || 'Failed to update stage');
    }
  };

  //////////////
  // Update Round
  /////////////

  const createNewRound = async () => {
    setError(null);
    if (!roomId || !room) {
      setError('No room loaded');
      return Promise.reject('No room loaded');
    }
    try {
      const nextRoundNumber = (typeof roundNumber === 'number' ? roundNumber : 0) + 1;
      const newRound = await createRound({ roomId, roundNumber: nextRoundNumber });
      if (newRound) setRound(newRound);
      setRoundNumber(nextRoundNumber);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create new round');
      return Promise.reject(err?.response?.data?.error || 'Failed to create new round');
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
      // optimistic update
      setRound((prev: any) => prev ? { ...prev, case_brief_id: caseBriefId } : prev);
      const updated = await setRoundCase({ roundId, caseBriefId });
      if (updated) setRound(updated);
      setError(null);
    } catch (err: any) {
      // rollback: refetch as a simple repair strategy
      try {
        const roundResult = await fetchRoundByRoomAndRoundNumber(roomId, roundNumber);
        setRound(roundResult);
      } catch {}
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
      // optimistic update
      setRound((prev: any) => prev ? { ...prev, candidate_id: candidateId } : prev);
      const updated = await setRoundCandidate({ roundId, candidateId });
      if (updated) setRound(updated);
      setError(null);
    } catch (err: any) {
      // rollback: refetch as a simple repair strategy
      try {
        const roundResult = await fetchRoundByRoomAndRoundNumber(roomId, roundNumber);
        setRound(roundResult);
      } catch {}
      setError(err?.response?.data?.error || 'Failed to set candidate');
      return Promise.reject(err?.response?.data?.error || 'Failed to set candidate');
    }
  };

  return {
    room,
    round,
    roomStage,
    isHost,
    isCandidate,
    updateStage,
    setCase,
    setCandidate,
    createNewRound,
    error,
    caseBriefs: sortedCaseBriefs,
  };
} 