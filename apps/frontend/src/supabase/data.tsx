import { supabase } from "./client";
import { Room, Round, Case, Profile } from "./types"


/**
 * Fetch all rooms or a single room if roomId is provided.
 * Joins profiles for host info.s
 */
export const fetchRooms = async (roomId?: string): Promise<Room[] | Room | null> => {
  // console.log('fetchRooms')
  let query = supabase
    .from('practice_rooms')
    .select('id, host_id, guest_id, datetime_utc, first_round_id, second_round_id, type, room_url, stage, private, created_at, host_profile:profiles!practice_rooms_host_id_fkey(user_id, first_name, last_name, avatar), guest_profile:profiles!practice_rooms_guest_id_fkey(user_id, first_name, last_name, avatar)')
    .order('datetime_utc', { ascending: true });

  if (roomId) {
    // Fetch a single room
    const { data, error } = await query.eq('id', roomId).single();
    if (error || !data) return null;
    return data;
  } else {
    // Fetch all rooms
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  }
};

/**
 * Fetch rooms for a specific user (as host or guest), newest first.
 * Includes joined host/guest profile info for display.
 */
export const fetchRoomsForUser = async (userId: string): Promise<Room[]> => {
  const { data, error } = await supabase
    .from('practice_rooms')
    .select('id, host_id, guest_id, datetime_utc, first_round_id, second_round_id, type, room_url, stage, private, created_at, host_profile:profiles!practice_rooms_host_id_fkey(user_id, first_name, last_name, avatar), guest_profile:profiles!practice_rooms_guest_id_fkey(user_id, first_name, last_name, avatar)')
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .order('datetime_utc', { ascending: false });

  if (error) {
    console.error('[fetchRoomsForUser] Database error:', error);
    throw new Error(error.message || 'Unkown Database Error');
  }
  return data ?? [];
};

export const fetchRoundByRoomAndRoundNumber = async (roomId?: string, roundNumber?: number): Promise<Round[] | Round | null> => {

  // If round number = 1, return row with round number = 1
  let query = supabase
    .from('practice_rounds')
    .select('id, host_id, room_id, round_number, candidate_id, case_brief_id, transcript, assessment, created_at')

  if (roomId && typeof roundNumber !== 'undefined') {
    const { data, error } = await query
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)
      .single();
    if (error || !data) return null;
    return data;
  }
};


export const fetchRoundsByCandidate = async (candidateId: string): Promise<Round[]> => {

    const { data, error } = await supabase
        .from('practice_rounds')
        .select('id, host_id, room_id, round_number, candidate_id, case_brief_id, transcript, assessment, created_at')
        .eq('candidate_id', candidateId);

    if (error) {
        console.error('[fetchRoundsByCandidate] Database error:', error);
        throw new Error(error.message || 'Unkown Database Error');
    }

    return data ?? [];
};

/**
 * Fetch all cases.
 */
export const fetchCaseBriefs = async (): Promise<Case[]> => {
  // console.log('fetchCaseBriefs')
  const { data, error } = await supabase
    .from('case_briefs')
    .select('id, category, condition, case_name, case_name_internal, type, actor_brief, candidate_brief');
  return data || [];
};

/**
 * Fetch a single profile by userId.
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar, training_level')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
};

/**
 * Subscribe to realtime changes on the practice_rooms table.
 * If roomId is provided, only subscribe to that room; otherwise, subscribe to all.
 * Returns a cleanup function to remove the channel.
 */
export function subscribeToPracticeRoom({
  roomId,
  onChange,
}: {
  roomId?: string;
  onChange: () => void;
}) {
  // console.log('subscribeToPracticeRoom')
  const filter = roomId ? `id=eq.${roomId}` : undefined;
  const channel = supabase.channel(
    roomId ? `practice_rooms:${roomId}` : "practice_rooms:all"
  ).on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "practice_rooms",
      ...(filter ? { filter } : {}),
    },
    onChange
  ).subscribe();

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
  onChange: () => void;
}) {
  const filter = `room_id=eq.${roomId}`;
  const channel = supabase
    .channel(`practice_rounds:room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "practice_rounds",
        filter,
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}