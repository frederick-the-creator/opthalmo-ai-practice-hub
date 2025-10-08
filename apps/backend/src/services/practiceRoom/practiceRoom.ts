import axios from 'axios'
import type { TypedSupabaseClient } from '../../utils/supabaseClient.js'
import { createRoomWithReturn, updatePracticeRoomWithReturn, getPracticeRoomById, deletePracticeRoomById } from '../../repositories/practiceRoom.js';
import { createRoundWithReturn, deleteRoundsByRoomId } from '../../repositories/practiceRound.js';
import { PracticeRoomInsert, PracticeRoomUpdate, PracticeRoom } from '../../types/index.js';
import { HttpError } from '../..//utils/index.js';
import { randomUUID } from 'crypto'
import { sendIcsNotification } from '../notifications/notification.js'



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
  const { hostId, startUtc, private: isPrivate, durationMinutes } = input;

  if (!hostId || !startUtc) {
    throw new Error('Missing required fields');
  }

  // Validate duration
  const allowedDurations = [30, 60, 90];
  if (!durationMinutes || !allowedDurations.includes(durationMinutes)) {
    throw new Error('Invalid duration');
  }

  const roomUrl = await createDailyRoom();
  const icsUid = randomUUID();

  const startIso = new Date(startUtc);
  const endUtc = new Date(startIso.getTime() + durationMinutes * 60 * 1000).toISOString();

  const roomData = await createRoomWithReturn(supabaseAuthenticated, {
    hostId,
    roomUrl,
    startUtc,
    icsUid,
    private: !!isPrivate,
    stage: "Prep",
    durationMinutes,
    endUtc,
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

  // Retrieve existing practice room to implement update guards
  const existing = await getPracticeRoomById(supabaseAuthenticated, updateFields.roomId);

  // Booking guard: Only bookable if no current guest
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

  // Reschedule guard: only host can change startUtc; must be future
  if (updateFields.startUtc !== undefined) {
    if (existing.hostId !== currentUserId) {
      throw new HttpError(403, 'Only the host can reschedule the session');
    }

    if (updateFields.startUtc == null) {
      throw new HttpError(400, 'Invalid datetime');
    }

    const newDate = new Date(updateFields.startUtc);
    if (isNaN(newDate.getTime())) {
      throw new HttpError(400, 'Invalid datetime');
    }

    const now = new Date();
    if (newDate.getTime() <= now.getTime()) {
      throw new HttpError(400, 'Please select a valid future date/time.');
    }
  }

  // Determine type of update (initial booking or reschedule)
  const isBooking = updateFields.guestId !== undefined && existing.guestId == null && updateFields.guestId !== null
  const isReschedule = updateFields.startUtc !== undefined && updateFields.startUtc != null && updateFields.startUtc !== existing.startUtc

  // If rescheduling, recompute updateFields with new endUtc and bump icsSequence
  // Else update practice room with updateFields as is
  let nextUpdate: PracticeRoomUpdate = { ...updateFields }
  if (isReschedule) {
    const duration = existing.durationMinutes
    const newStart = updateFields.startUtc as string
    const newEnd = new Date(new Date(newStart).getTime() + duration * 60 * 1000).toISOString()
    nextUpdate = { ...nextUpdate, endUtc: newEnd, icsSequence: (existing.icsSequence ?? 0) + 1 }
  }
  const room = await updatePracticeRoomWithReturn(supabaseAuthenticated, nextUpdate);

  // Send notification email for case when booking or reschedule. In case of reschedule, room passed will have new details
  try {
    if (isBooking || (isReschedule && existing.guestId)) await sendIcsNotification('REQUEST', room)
  } catch (e: any) {
    console.warn('[updatePracticeRoomGuarded] notification failed (ignored):', e?.message)
  }
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
  let existing: PracticeRoom
  try {
    existing = await getPracticeRoomById(supabaseAuthenticated, roomId);
  } catch (e: any) {
    if (e?.message === 'Room not found') {
      throw new HttpError(404, 'Room not found');
    }
    throw e
  }

  if (existing.hostId !== currentUserId) {
    throw new HttpError(403, 'Only the host can delete this session');
  }

  // Send CANCEL only if a guest had booked the session
  if (existing.guestId) {
    try {
      await sendIcsNotification('CANCEL', existing)
    } catch (e: any) {
      console.warn('[deletePracticeRoomGuarded] notification failed (ignored):', e?.message)
    }
  }

  // Delete dependent rows first
  await deleteRoundsByRoomId(supabaseAuthenticated, roomId);
  // Then delete the room
  await deletePracticeRoomById(supabaseAuthenticated, roomId);

  return { deleted: true, roomId };
}