import { useState, useEffect } from 'react';
import { Stage } from './types';
import { fetchRooms,  fetchRound, subscribeToPracticeRoom } from '@/supabase/utils';
import { supabase } from '@/supabase/client';
import { setRoundCandidate, setRoundCase, setStage } from "@/lib/api";

// Define the return type for clarity (can be expanded later)
interface UseInterviewRoomResult {
  room: any; // TODO: type this properly
  round:  any;
  stage: Stage;
  isHost: 'host' | 'guest' | null;
  isCandidate: boolean;
  updateStage: (nextStage: Stage) => Promise<void>;
  setCase: (roundId: string, caseBriefId: string) => Promise<void>;
  setCandidate: (roundId: string, userId: string) => Promise<void>;
  error: string | null;
}


export function useInterviewRoom(roomId: string | null): UseInterviewRoomResult {
  const [room, setRoom] = useState<any>(null);
  const [round, setRound] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted) setUserId(user?.id || null);
      } catch (err: any) {
        if (isMounted) setUserId(null);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [roomId]);

  // Initial fetch of room and round from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const roomResult = roomId ? await fetchRooms(roomId) : null;
        const roundResult = roomId ? await fetchRound(roomId) : null;
        if (isMounted) setRoom(roomResult);
        if (isMounted) setRound(roundResult);
      } catch (err: any) {
        if (isMounted) setError('Failed to fetch room');
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [roomId]);

  // Set up Realtime subscription so room can react to changes in the DB by the other user.
  useEffect(() => {
    if (!roomId) return;
    const cleanup = subscribeToPracticeRoom({
      roomId,
      onChange: async () => {
        try {
          const result = await fetchRooms(roomId);
          setRoom(result);
          console.log('Realtime subscription room', result)
        } catch (err) {
          setError('Failed to update room from realtime');
        }
      }
    });
    return cleanup;
  }, [roomId]);

  // Derive stage from supabase
  let stage: Stage = Stage.PREP;
  if (room && room.stage) {
    if (room.stage === Stage.PREP) stage = Stage.PREP;
    else if (room.stage === Stage.INTERVIEW) stage = Stage.INTERVIEW;
    else if (room.stage === Stage.WRAP_UP) stage = Stage.WRAP_UP;
  }

  // Derive isHosts of current user (host / guest / candidate)
  let isHost: 'host' | 'guest' | null = null;
  let isCandidate = false;
  if (userId && room) {
    if (userId === room.host_id) isHost = 'host';
    else if (userId === room.guest_id) isHost = 'guest';
    if (userId === round.candidate_id) isCandidate = true;
  }

  // Helper: updateStage
  const updateStage = async (nextStage: Stage) => {
    setError(null);
    if (!roomId || !room) {
      setError('No room loaded');
      return Promise.reject('No room loaded');
    }
    if (isHost !== 'host') {
      setError('Only the host can change the stage');
      return Promise.reject('Only the host can change the stage');
    }
    // Business rules
    if (nextStage === Stage.INTERVIEW) {
      // START_INTERVIEW
      if (stage !== Stage.PREP) {
        setError('Can only start interview from PREP stage');
        return Promise.reject('Can only start interview from PREP stage');
      }
      if (!round.candidate_id || !round.case_brief_id) {
        setError('Candidate and case must be set before starting interview');
        return Promise.reject('Candidate and case must be set before starting interview');
      }
    } else if (nextStage === Stage.WRAP_UP) {
      // FINISH_INTERVIEW
      if (stage !== Stage.INTERVIEW) {
        setError('Can only finish interview from INTERVIEW stage');
        return Promise.reject('Can only finish interview from INTERVIEW stage');
      }
    } else if (nextStage === Stage.PREP) {
      // RESET_TO_PREP
      if (stage !== Stage.INTERVIEW && stage !== Stage.WRAP_UP) {
        setError('Can only reset to PREP from INTERVIEW or WRAP_UP');
        return Promise.reject('Can only reset to PREP from INTERVIEW or WRAP_UP');
      }
    }
    try {
      await setStage({ roomId, stage: nextStage });
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
    if (isHost !== 'host') {
      setError('Only the host can set the case');
      return Promise.reject('Only the host can set the case');
    }
    if (stage !== Stage.PREP) {
      setError('Can only set case in PREP stage');
      return Promise.reject('Can only set case in PREP stage');
    }
    try {
      await setRoundCase({ roundId, caseBriefId });
      const roundResult = await fetchRound(roomId);
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
    if (isHost !== 'host') {
      setError('Only the host can set the candidate');
      return Promise.reject('Only the host can set the candidate');
    }
    if (stage !== Stage.PREP) {
      setError('Can only set candidate in PREP stage');
      return Promise.reject('Can only set candidate in PREP stage');
    }
    try {
      await setRoundCandidate({ roundId, candidateId });
      const roundResult = await fetchRound(roomId);
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
    stage,
    isHost,
    isCandidate,
    updateStage,
    setCase,
    setCandidate,
    error,
  };
} 