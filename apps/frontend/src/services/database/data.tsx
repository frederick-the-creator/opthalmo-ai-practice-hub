import { supabase } from "../../utils/supabaseClient";
import type { Case, Profile, PracticeRoomWithProfiles, PracticeRound } from "@/types";
import { ProfileMapper, PracticeRoomWithProfilesMapper, PracticeRoundMapper, CaseMapper } from "@/types";


/**
 * Fetch all rooms or a single room if roomId is provided.
 * Joins profiles for host/guest info.
 */
export async function fetchRoomWithProfiles(roomId: string): Promise<PracticeRoomWithProfiles | null> {
  const { data, error } = await supabase
    .from('practice_rooms')
    .select('id, host_id, guest_id, start_utc, end_utc, duration_minutes, ics_sequence, room_url, ics_uid, stage, private, created_at, host_profile:profiles!practice_rooms_host_id_fkey(user_id, first_name, last_name, avatar), guest_profile:profiles!practice_rooms_guest_id_fkey(user_id, first_name, last_name, avatar)')
    .order('start_utc', { ascending: true })
    .eq('id', roomId)
    .single();

  if (error) {
    console.log('[fetchRoomWithProfiles] DB error: ', error)
  }

  return PracticeRoomWithProfilesMapper.fromDb(data as any);
}

/**
 * Fetch all rooms or a single room if roomId is provided.
 * Joins profiles for host/guest info.
 */
export async function fetchAllRooms(): Promise<PracticeRoomWithProfiles[] | []> {
  const { data, error } = await supabase
    .from('practice_rooms')
    .select('id, host_id, guest_id, start_utc, end_utc, duration_minutes, ics_sequence, room_url, ics_uid, stage, private, created_at, host_profile:profiles!practice_rooms_host_id_fkey(user_id, first_name, last_name, avatar), guest_profile:profiles!practice_rooms_guest_id_fkey(user_id, first_name, last_name, avatar)')
    .order('start_utc', { ascending: true });

  if (error) {
    console.log('[fetchAllRooms] DB error: ', error)
    throw new Error(error.message || 'Failed to fetch rooms');
  }

  if (!data) {
    return [];
  }

  return (data ?? []).map((r) => PracticeRoomWithProfilesMapper.fromDb(r as any)!).filter(Boolean) as PracticeRoomWithProfiles[];
}


// .select returns an array. If no data found, returns null
// .single returns the object or null if no data found

/**
 * Fetch rooms for a specific user (as host or guest), newest first.
 * Includes joined host/guest profile info for display.
 */
export const fetchRoomsForUser = async (userId: string): Promise<PracticeRoomWithProfiles[] | []> => {
  const { data, error } = await supabase
    .from('practice_rooms')
    .select('id, host_id, guest_id, start_utc, end_utc, duration_minutes, ics_sequence, room_url, ics_uid, stage, private, created_at, host_profile:profiles!practice_rooms_host_id_fkey(user_id, first_name, last_name, avatar), guest_profile:profiles!practice_rooms_guest_id_fkey(user_id, first_name, last_name, avatar)')
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .order('start_utc', { ascending: false });

  if (error) {
    console.error('[fetchRoomsForUser] Database error:', error);
    throw new Error(error.message || 'Failed to fetch rooms');
  }

  if (!data) {
    return [];
  }

  return (data ?? []).map((r) => PracticeRoomWithProfilesMapper.fromDb(r as any)!).filter(Boolean) as PracticeRoomWithProfiles[];
};

export const fetchRoundByRoomAndRoundNumber = async (roomId: string, roundNumber: number): Promise<PracticeRound | null> => {

  // If round number = 1, return row with round number = 1
  const { data, error } = await supabase
    .from('practice_rounds')
    .select('id, room_id, round_number, candidate_id, case_brief_id, transcript, assessment, created_at')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)
    .single();

  if (error) {
    console.log('[fetchRoundByRoomAndRoundNumber] DB error: ', error)
    throw new Error(error.message || 'Failed to fetch round');
  }
  
  return data ? PracticeRoundMapper.fromDb(data as any) : null;
};


export const fetchRoundsByCandidate = async (candidateId: string): Promise<PracticeRound[] | []> => {

    const { data, error } = await supabase
      .from('practice_rounds')
      .select('id, room_id, round_number, candidate_id, case_brief_id, transcript, assessment, created_at')
      .eq('candidate_id', candidateId);

    if (error) {
      console.error('[fetchRoundsByCandidate] Database error:', error);
      throw new Error(error.message || 'Failed to fetch rounds');
    }

    if (!data) {
      return [];
    }

    return (data ?? []).map((r) => PracticeRoundMapper.fromDb(r as any));
};

/**
 * Fetch the room (with joined host/guest profiles) associated with a given round ID.
 */
export const fetchRoomByRoundId = async (roundId: string): Promise<PracticeRoomWithProfiles | null> => {
  const { data: round, error: roundError } = await supabase
    .from('practice_rounds')
    .select('room_id')
    .eq('id', roundId)
    .single();

  if (roundError) {
    console.error('[fetchRoomByRoundId] Database error:', roundError);
  }

  const { data: room, error: roomError } = await supabase
    .from('practice_rooms')
    .select('id, host_id, guest_id, start_utc, end_utc, duration_minutes, ics_sequence, room_url, stage, private, created_at, host_profile:profiles!practice_rooms_host_id_fkey(user_id, first_name, last_name, avatar), guest_profile:profiles!practice_rooms_guest_id_fkey(user_id, first_name, last_name, avatar)')
    .eq('id', round.room_id as string)
    .single();

  if (roomError) {
    console.error('[fetchRoomByRoundId] Database error:', roomError);
  }

  return PracticeRoomWithProfilesMapper.fromDb(room as any);
};

/**
 * Fetch the case brief for a given case ID.
 */
export const fetchCasebyCaseId = async (caseId: string): Promise<Case | null> => {
  const { data, error } = await supabase
    .from('case_briefs')
    .select('id, category, condition, case_name, case_name_internal, type, actor_brief, candidate_brief')
    .eq('id', caseId)
    .single();

  if (error) {
    console.log('[fetchCasebyCaseId] DB error: ', error)
  }

  return data ? CaseMapper.fromDb(data as any) : null;
};

/**
 * Fetch all cases.
 */
export const fetchCaseBriefs = async (): Promise<Case[] | []> => {
  // console.log('fetchCaseBriefs')
  const { data, error } = await supabase
    .from('case_briefs')
    .select('id, category, condition, case_name, case_name_internal, type, actor_brief, candidate_brief');

  if (error) {
    console.error('[fetchCaseBriefs] Database error:', error);
    throw new Error(error.message || 'Failed to fetch cases');
  }

  if (!data) {
    return [];
  }

  return (data ?? []).map((r) => CaseMapper.fromDb(r as any));
};

/**
 * Fetch the current user's profile.
 * Returns null if no authenticated user or profile not found.
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.log('[fetchProfile] DB error: ', error)
  }
  
  return ProfileMapper.fromDb(data as any);
};

export function subscribeToAllPracticeRooms({
  onChange,
}: {
  onChange: (ev: { event: 'INSERT' | 'UPDATE' | 'DELETE'; new?: PracticeRoomWithProfiles | null; old?: PracticeRoomWithProfiles | null }) => void;
}) {
  const channel = supabase
    .channel(
      "practice_rooms:all", 
      { config: { private: true } })
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "practice_rooms",
      },
      (payload: any) => {
        let mappedNew: PracticeRoomWithProfiles | null = null;
        let mappedOld: PracticeRoomWithProfiles | null = null;
        try {
          if (payload?.new) mappedNew = PracticeRoomWithProfilesMapper.fromDb(payload.new as any);
        } catch (_e) {}
        try {
          if (payload?.old) mappedOld = PracticeRoomWithProfilesMapper.fromDb(payload.old as any);
        } catch (_e) {}
        onChange({
          event: payload.eventType,
          new: mappedNew,
          old: mappedOld,
        })
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to realtime changes on the practice_rooms table.
 * If roomId is provided, only subscribe to that room; otherwise, subscribe to all.
 * Returns a cleanup function to remove the channel.
 */
export function subscribeToPracticeRoomByRoomId({
  roomId,
  onChange,
}: {
  roomId: string;
  onChange: (ev: { event: 'INSERT' | 'UPDATE' | 'DELETE'; new?: PracticeRoomWithProfiles | null; old?: PracticeRoomWithProfiles | null }) => void;
}) {
  const filter = `id=eq.${roomId}`;
  const channel = supabase
    .channel(
      `practice_rooms:${roomId}`, 
      { config: { private: true } })
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "practice_rooms",
        filter,
      },
      (payload: any) => {
        let mappedNew: PracticeRoomWithProfiles | null = null;
        let mappedOld: PracticeRoomWithProfiles | null = null;
        try {
          if (payload?.new) mappedNew = PracticeRoomWithProfilesMapper.fromDb(payload.new as any);
        } catch (_e) {}
        try {
          if (payload?.old) mappedOld = PracticeRoomWithProfilesMapper.fromDb(payload.old as any);
        } catch (_e) {}
        onChange({
          event: payload.eventType,
          new: mappedNew,
          old: mappedOld,
        })
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to realtime changes on practice_rounds filtered by room_id.
 * Useful when you only know the roomId and want any round changes for that room.
 */
export function subscribeToPracticeRoundsByRoomId({
  roomId,
  onChange,
}: {
  roomId: string;
  onChange: (ev: { event: 'INSERT' | 'UPDATE' | 'DELETE'; new?: PracticeRound | null; old?: PracticeRound | null }) => void;
}) {
  const filter = `room_id=eq.${roomId}`;
  const channel = supabase
    .channel(
      `practice_rounds:room:${roomId}`, 
      { config: { private: true } }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "practice_rounds",
        filter,
      },
      (payload: any) => {
        let mappedNew: PracticeRound | null = null;
        let mappedOld: PracticeRound | null = null;
        try {
          if (payload?.new) {
            mappedNew = PracticeRoundMapper.fromDb(payload.new as any);
          }
        } catch (_e) {}
        try {
          if (payload?.old) {
            mappedOld = PracticeRoundMapper.fromDb(payload.old as any);
          }
        } catch (_e) {}
        onChange({
          event: payload.eventType,
          new: mappedNew,
          old: mappedOld,
        })
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Upsert the user's profile using user_id as onConflict key.
 * Requires first_name and last_name; avatar is optional.
 */
 