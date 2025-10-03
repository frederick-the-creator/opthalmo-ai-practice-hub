import axios from 'axios'
import type { TypedSupabaseClient } from '../utils/supabase'
import { createRoomWithReturn, updatePracticeRoomWithReturn, getPracticeRoomById, deletePracticeRoomById } from '../repositories/practiceRoom';
import { createRoundWithReturn, deleteRoundsByRoomId } from '../repositories/practiceRound';
import { PracticeRoomInsert, PracticeRoomUpdate, PracticeRoom } from '../types';
import { HttpError } from '../utils';
import { randomUUID } from 'crypto'



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
export async function createPracticeRoom(supabaseAuthenticated: TypedSupabaseClient, input: PracticeRoomInsert): Promise<any> {
  const { hostId, datetimeUtc, private: isPrivate } = input;

  if (!hostId || !datetimeUtc) {
    throw new Error('Missing required fields');
  }

  const roomUrl = await createDailyRoom();
  const icsUid = randomUUID();

  const roomData = await createRoomWithReturn(supabaseAuthenticated, {
    hostId,
    roomUrl,
    datetimeUtc,
    icsUid,
    private: !!isPrivate,
    stage: "Prep",
  });

  const roomId = roomData.id
  await createRoundWithReturn(supabaseAuthenticated, { roundNumber: 1, roomId })

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
  supabaseAuthenticated: TypedSupabaseClient,
  roundId: string,
  fields: Record<string, any>
  ): Promise<any> {
  const { data, error } = await supabaseAuthenticated
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

/**
 * Apply business rules and update a practice room.
 * - Host cannot book own session (403)
 * - Requester can only book themselves as guest (403)
 * - If already booked, do not overwrite (409)
 */
export async function updatePracticeRoomGuarded(
  supabaseAuthenticated: TypedSupabaseClient,
  currentUserId: string,
  updateFields: PracticeRoomUpdate
): Promise<PracticeRoom> {
  const existing = await getPracticeRoomById(supabaseAuthenticated, updateFields.roomId);

  // Booking guard
  if (updateFields.guestId !== undefined) {
    if (existing.hostId === currentUserId) {
      throw new HttpError(403, 'Host cannot book own session');
    }

    if (updateFields.guestId !== currentUserId) {
      throw new HttpError(403, 'You can only book yourself as guest');
    }

    if (existing.guestId) {
      throw new HttpError(409, 'Session already booked');
    }
  }

  // Reschedule guard: only host can change datetime; must be future
  if (updateFields.datetimeUtc !== undefined) {
    if (existing.hostId !== currentUserId) {
      throw new HttpError(403, 'Only the host can reschedule the session');
    }

    if (updateFields.datetimeUtc == null) {
      throw new HttpError(400, 'Invalid datetime');
    }

    const newDate = new Date(updateFields.datetimeUtc);
    if (isNaN(newDate.getTime())) {
      throw new HttpError(400, 'Invalid datetime');
    }

    const now = new Date();
    if (newDate.getTime() <= now.getTime()) {
      throw new HttpError(400, 'Please select a valid future date/time.');
    }
  }

  const room = await updatePracticeRoomWithReturn(supabaseAuthenticated, updateFields);
  return room;
}

/**
 * Delete a practice room and its rounds.
 * - Only the host can delete the session.
 * - Deletes dependent `practice_rounds` first, then `practice_rooms`.
 */
export async function deletePracticeRoomGuarded(
  supabaseAuthenticated: TypedSupabaseClient,
  currentUserId: string,
  roomId: string
): Promise<{ deleted: true; roomId: string }> {
  const existing = await getPracticeRoomById(supabaseAuthenticated, roomId);

  if (existing.hostId !== currentUserId) {
    throw new HttpError(403, 'Only the host can delete this session');
  }

  // Delete dependent rows first
  await deleteRoundsByRoomId(supabaseAuthenticated, roomId);
  // Then delete the room
  await deletePracticeRoomById(supabaseAuthenticated, roomId);

  return { deleted: true, roomId };
}