import axios from 'axios'
import adminSupabase from '../utils/supabase'
import { createRoomWithReturn, updatePracticeRoomWithReturn } from '../repositories/practiceRoom';
import { createRoundWithReturn } from '../repositories/practiceRound';
import { PracticeRoomInsert } from '../types';



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

/**
* Create a practice room by provisioning a Daily.co room and inserting the room in Supabase.
* @returns The created room object
*/
export async function createPracticeRoom(input: PracticeRoomInsert): Promise<any> {
  const { hostId, datetimeUtc, private: isPrivate } = input;

  if (!hostId || !datetimeUtc) {
    throw new Error('Missing required fields');
  }

  const roomUrl = await createDailyRoom();

  const roomData = await createRoomWithReturn({
    hostId,
    roomUrl,
    datetimeUtc,
    private: !!isPrivate,
    stage: "Prep",
  });

  const roomId = roomData.id
  await createRoundWithReturn({ roundNumber: 1, roomId })

  return roomData;
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