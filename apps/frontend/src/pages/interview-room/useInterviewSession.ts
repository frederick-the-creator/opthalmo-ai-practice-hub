import { useState, useEffect } from 'react';
import { Stage } from '@/supabase/types';
import { fetchSessions, subscribeToPracticeSessions } from '@/supabase/utils';
import { supabase } from '@/supabase/client';
import { setCandidate as setCandidateApi, setCase as setCaseApi, setStage as setStageApi } from "@/lib/api";

// Define the return type for clarity (can be expanded later)
interface UseInterviewSessionResult {
  session: any; // TODO: type this properly
  stage: Stage;
  role: 'host' | 'guest' | null;
  isCandidate: boolean;
  updateStage: (nextStage: Stage) => Promise<void>;
  setCase: (caseId: string) => Promise<void>;
  setCandidate: (userId: string) => Promise<void>;
  error: string | null;
}

export function useInterviewSession(sessionId: string | null): UseInterviewSessionResult {
  const [session, setSession] = useState<any>(null); // TODO: type this properly
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
  }, [sessionId]);

  // Initial fetch of session from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const result = sessionId ? await fetchSessions(sessionId) : null;
        if (isMounted) setSession(result);
      } catch (err: any) {
        if (isMounted) setError('Failed to fetch session');
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [sessionId]);

  // Set up Realtime subscription so session can react to changes in the DB by the other user.
  useEffect(() => {
    if (!sessionId) return;
    const cleanup = subscribeToPracticeSessions({
      sessionId,
      onChange: async () => {
        try {
          const result = await fetchSessions(sessionId);
          setSession(result);
        } catch (err) {
          setError('Failed to update session from realtime');
        }
      }
    });
    return cleanup;
  }, [sessionId]);

  // Derive stage from supabase
  let stage: Stage = Stage.PREP;
  if (session && session.version) {
    if (session.version === Stage.PREP) stage = Stage.PREP;
    else if (session.version === Stage.INTERVIEW) stage = Stage.INTERVIEW;
    else if (session.version === Stage.WRAP_UP) stage = Stage.WRAP_UP;
  }

  // Derive roles of current user (host / guest / candidate)
  let role: 'host' | 'guest' | null = null;
  let isCandidate = false;
  if (userId && session) {
    if (userId === session.host_id) role = 'host';
    else if (userId === session.guest_id) role = 'guest';
    if (userId === session.candidate_id) isCandidate = true;
  }

  // Helper: updateStage
  const updateStage = async (nextStage: Stage) => {
    setError(null);
    if (!sessionId || !session) {
      setError('No session loaded');
      return Promise.reject('No session loaded');
    }
    if (role !== 'host') {
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
      if (!session.candidate_id || !session.case_id) {
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
      await setStageApi({ sessionId, version: nextStage });
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update stage');
      return Promise.reject(err?.response?.data?.error || 'Failed to update stage');
    }
  };

  // Helper: setCase
  const setCase = async (caseId: string) => {
    setError(null);
    if (!sessionId || !session) {
      setError('No session loaded');
      return Promise.reject('No session loaded');
    }
    if (role !== 'host') {
      setError('Only the host can set the case');
      return Promise.reject('Only the host can set the case');
    }
    if (stage !== Stage.PREP) {
      setError('Can only set case in PREP stage');
      return Promise.reject('Can only set case in PREP stage');
    }
    try {
      await setCaseApi({ sessionId, caseId });
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to set case');
      return Promise.reject(err?.response?.data?.error || 'Failed to set case');
    }
  };

  // Helper: setCandidate
  const setCandidate = async (candidateUserId: string) => {
    setError(null);
    if (!sessionId || !session) {
      setError('No session loaded');
      return Promise.reject('No session loaded');
    }
    if (role !== 'host') {
      setError('Only the host can set the candidate');
      return Promise.reject('Only the host can set the candidate');
    }
    if (stage !== Stage.PREP) {
      setError('Can only set candidate in PREP stage');
      return Promise.reject('Can only set candidate in PREP stage');
    }
    try {
      await setCandidateApi({ sessionId, candidateId: candidateUserId });
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to set candidate');
      return Promise.reject(err?.response?.data?.error || 'Failed to set candidate');
    }
  };

  return {
    session,
    stage,
    role,
    isCandidate,
    updateStage,
    setCase,
    setCandidate,
    error,
  };
} 