import { useState, useEffect, useMemo } from 'react';
import { fetchRoomWithProfiles,  fetchRoundByRoomAndRoundNumber, fetchLatestRoundByRoom, subscribeToPracticeRoomByRoomId, subscribeToPracticeRoundsByRoomId, subscribeToPracticeRoundsByRoundId, fetchCaseBriefs } from '@/services/database/data';
import { useAuth } from '@/store/AuthProvider';
import { setRoundCandidate, setRoundCase, setRoomStage as setRoomStageApi, createRound } from "@/services/api/api";
import { mapApiError } from "@/services/api/utils";
import type { PracticeRoomWithProfiles, PracticeRound, Case } from '@/types';

// Define the return type for clarity (can be expanded later)
interface UseInterviewRoomResult {
  room: PracticeRoomWithProfiles | null;
  round: PracticeRound | null;
  roomStage: string;
  isHost: boolean;
  isCandidate: boolean;
  updateStage: (nextStage: string) => Promise<void>;
  setCase: (roundId: string, caseBriefId: string) => Promise<void>;
  setCandidate: (roundId: string, userId: string) => Promise<void>;
  createNewRound: () => Promise<void>;
  error: string | null;
  caseBriefs: Case[];
}


export function useInterviewRoom(roomId: string | null): UseInterviewRoomResult {
  const { user } = useAuth();
  const [room, setRoom] = useState<PracticeRoomWithProfiles | null>(null);
  const [round, setRound] = useState<PracticeRound | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [roomStage, setRoomStage] = useState<string>('Prep');
  const [error, setError] = useState<string | null>(null);
  const [caseBriefs, setCaseBriefs] = useState<Case[]>([]);


  //////////////
  // User Logic
  /////////////


  const [isCandidate, setIsCandidate] = useState(false)
  useEffect(() => {
    if (user?.id && room) {
      if (user?.id === (round?.candidateId)) {
        setIsCandidate(true)
      } else {
        setIsCandidate(false)
      };
    }
  }, [round?.candidateId])


  let isHost = false;
  if (user?.id && room) {
    if (user?.id === room.hostId) isHost = true;
  }

  console.log('round', round)
  console.log('isCandidate', isCandidate)

  //////////////
  // Initial fetch of Room and Round
  /////////////

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const roomResult = roomId ? await fetchRoomWithProfiles(roomId) : null;
        const roundResult = roomId ? await fetchLatestRoundByRoom(roomId) : null;
        if (isMounted) setRoom(roomResult);
        if (isMounted && roomResult) setRoomStage(roomResult.stage);
        if (isMounted) setRound(roundResult);
        if (isMounted && typeof roundResult?.roundNumber === 'number') {
          setRoundNumber(roundResult.roundNumber);
        }
      } catch (err: any) {
        if (isMounted) setError('Failed to fetch room');
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [roomId]);

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
      const aName = (a?.caseName ?? '').toString();
      const bName = (b?.caseName ?? '').toString();
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
      onChange: async ({ event, new: rec }) => {
        console.log('Practice Room subscription change detected')
        // For INSERT/UPDATE on this room, refetch to pick up joined profiles
        if (event === 'INSERT' || event === 'UPDATE') {
          try {
            // Prefer mapped record if provided, otherwise refetch joined profiles
            if (rec) {
              const result = await fetchRoomWithProfiles(roomId);
              setRoom(result);
              if (result) setRoomStage(result.stage);
            }
          } catch (err) {
            setError('Failed to update room from realtime');
          }
        }
      }
    });
    return cleanup;
  }, []);

  // Subscribe to new round for this room so both participants get new round
  useEffect(() => {
    if (!roomId) return;
    const cleanup = subscribeToPracticeRoundsByRoomId({
      roomId,
      onChange: ({ event, new: rec }) => {
        if (event === 'INSERT' && rec) {
          setRound(rec);
          if (typeof rec.roundNumber === 'number') {
            setRoundNumber(rec.roundNumber);
          }
        }
      }
    });
    return cleanup;
  }, [roomId]);

  // Subscribe to changes on the current round (candidate/case/transcript/assessment updates)
  useEffect(() => {
    if (!round?.id) return;
    console.log('subscribing to round: ', round.id)
    const cleanup = subscribeToPracticeRoundsByRoundId({
      roundId: round.id,
      onChange: ({ event, new: rec }) => {
        console.log('Practice Round subscription change detected')
        if ((event === 'INSERT' || event === 'UPDATE') && rec) {
          setRound(rec);
          if (typeof rec.roundNumber === 'number') {
            setRoundNumber(rec.roundNumber);
          }
        }
      }
    });
    return cleanup;
  }, [round?.id]);

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
      setRoom((prev) => prev ? { ...prev, stage: nextStage } : prev);

      const updatedRoom = await setRoomStageApi({ roomId, stage: nextStage });
      if (updatedRoom) {
        setRoom(updatedRoom as any);
        setRoomStage(updatedRoom.stage);
      }
      setError(null);
    } catch (err: any) {
      // rollback: refetch as a simple repair strategy
      try {
        const latest = await fetchRoomWithProfiles(roomId);
        setRoom(latest);
        if (latest) setRoomStage(latest.stage);
      } catch {}
      const { title, description } = mapApiError(err, 'generic');
      const msg = title + (description ? ": " + description : "");
      setError(msg || 'Failed to update stage');
      return Promise.reject(msg || 'Failed to update stage');
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
      const { title, description } = mapApiError(err, 'round');
      const msg = title + (description ? ": " + description : "");
      setError(msg || 'Failed to create new round');
      return Promise.reject(msg || 'Failed to create new round');
    }
  };

  
  // Helper: setCase
  const setCase = async (roundId: string, caseBriefId: string) => {
    setError(null);
    if (!roomId || !room) {
      setError('No room loaded');
      return Promise.reject('No room loaded');
    }
    try {
      // optimistic update
      setRound((prev) => prev ? { ...prev, caseBriefId } : prev);
      const updated = await setRoundCase({ roundId, caseBriefId });
      if (updated) setRound(updated);
      setError(null);
    } catch (err: any) {
      // rollback: refetch as a simple repair strategy
      try {
        const roundResult = await fetchRoundByRoomAndRoundNumber(roomId, roundNumber);
        setRound(roundResult);
      } catch {}
      const { title, description } = mapApiError(err, 'round');
      const msg = title + (description ? ": " + description : "");
      setError(msg || 'Failed to set case');
      return Promise.reject(msg || 'Failed to set case');
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
      setRound((prev) => prev ? { ...prev, candidateId } : prev);
      const updated = await setRoundCandidate({ roundId, candidateId });
      if (updated) setRound(updated);
      setError(null);
    } catch (err: any) {
      // rollback: refetch as a simple repair strategy
      try {
        const roundResult = await fetchRoundByRoomAndRoundNumber(roomId, roundNumber);
        setRound(roundResult);
      } catch {}
      const { title, description } = mapApiError(err, 'round');
      const msg = title + (description ? ": " + description : "");
      setError(msg || 'Failed to set candidate');
      return Promise.reject(msg || 'Failed to set candidate');
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