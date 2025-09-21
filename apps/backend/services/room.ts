import axios from 'axios'
import adminSupabase from '../utils/supabase'


/**
 * Insert a new practice room into the database.
 * @param fields - The fields for the new room (e.g., { host_id, date, time, type, room_url }).
 * @returns The inserted room object.
 * @throws If the insert fails.
 */
export async function createSupabaseRoom(fields: Record<string, any>): Promise<any> {
  const { data, error } = await adminSupabase
    .from('practice_rooms')
    .insert([fields])
    .select();
  if (error) {
    throw new Error(error.message || 'Failed to create room');
  }
  if (!data || !data[0]) {
    throw new Error('No room created');
  }
  return { data, error: null };
}

/**
 * Create a new Daily.co room and return its URL.
 * @returns The created room URL.
 * @throws If the room creation fails.
 */
export async function createDailyRoom(): Promise<string> {
  try {
    const dailyRes = await axios.post(
      'https://api.daily.co/v1/rooms',
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return dailyRes.data.url;
  } catch (error: any) {
    console.error('Error creating Daily.co room:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to create Daily.co room');
  }
}

export interface createRoundInput {
  room_id: string;
  host_id: string;
}

/**
* Create a practice room by provisioning a Daily.co room and inserting the room in Supabase.
* @returns The created room object
*/
export async function createSupabaseRound(input: createRoundInput): Promise<any> {
  const { room_id } = input;
  if (!room_id) {
    throw new Error('createSupabaseRound - Missing required fields');
  }
  const { data, error } = await adminSupabase
    .from('practice_rounds')
    .insert([input])
    .select();
  if (error) {
    throw new Error(error.message || 'Failed to create room');
  }
  if (!data || !data[0]) {
    throw new Error('No room created');
  }

  return { data, error: null };
}

export interface createPracticeRoomInput {
  host_id: string;
  type: string;
  datetime_utc: string;
  private?: boolean;
}

/**
* Create a practice room by provisioning a Daily.co room and inserting the room in Supabase.
* @returns The created room object
*/
export async function createPracticeRoom(input: createPracticeRoomInput): Promise<any> {
  const { host_id, type, datetime_utc, private: isPrivate } = input;

  if (!host_id || !type || !datetime_utc) {
    throw new Error('Missing required fields');
  }

  const roomUrl = await createDailyRoom();

  const { data: roomData } = await createSupabaseRoom({
    host_id,
    type,
    room_url: roomUrl,
    datetime_utc,
    private: !!isPrivate,
  });

  const room_id = roomData[0].id
  const { data: roundData } = await createSupabaseRound({ room_id, host_id })

  const round_id = roundData[0].id
  const { data: updatedRoomData } = await updateSupabaseRoom(room_id, { first_round_id: round_id})

  return updatedRoomData[0];
}


/**
* Update a practice room with given fields.
* @param roomId - The room ID to update.
* @param fields - The fields to update (e.g., { guest_id: '...', candidate_id: '...' }).
* @returns The updated room object.
* @throws If the update fails.
*/
export async function updateSupabaseRoom(
  roomId: string,
  fields: Record<string, any>
): Promise<any> {
  const { data, error } = await adminSupabase
    .from('practice_rooms')
    .update(fields)
    .eq('id', roomId)
    .select();
  if (error) {
    throw new Error(error.message || 'Failed to update room');
  }
  if (!data || !data[0]) {
    throw new Error('No room found or updated');
  }
  return { data, error: null };
}


/**
* Update a practice room with given fields.
* @param roomId - The room ID to update.
* @param fields - The fields to update (e.g., { guest_id: '...', candidate_id: '...' }).
* @returns The updated room object.
* @throws If the update fails.
*/
export async function updateSupabaseRound(
  roundId: string,
  fields: Record<string, any>
  ): Promise<any> {
  const { data, error } = await adminSupabase
    .from('practice_rounds')
    .update(fields)
    .eq('id', roundId)
    .select();
  if (error) {
    throw new Error(error.message || 'Failed to update room');
  }
  if (!data || !data[0]) {
    throw new Error('No room found or updated');
  }
  return { data, error: null };
}