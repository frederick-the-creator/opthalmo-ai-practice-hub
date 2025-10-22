
import type { TypedSupabaseClient } from '@/utils/supabaseClient.js'
import { createRoomWithReturn, updatePracticeRoomWithReturn, getPracticeRoomById, deletePracticeRoomById } from '@/features/scheduling/practiceRoom/practiceRoom.repo.js';
import { createRoundWithReturn, deleteRoundsByRoomId } from '@/features/practiceRound/practiceRound.repo.js';
import { PracticeRoom, UpdatePracticeRoom } from '@/features/scheduling/practiceRoom/practiceRoom.types.js';
import { HttpError } from '@/lib/httpError.js';
import { randomUUID } from 'crypto'
import { isNotificationReady, sendNotification } from '@/features/scheduling/notification/services/notification.service.js'
import { NewRoomBody } from './practiceRoom.schemas.js';
import { createDailyRoom } from '@/features/assessment/recording.service.js';


/**
* Create a practice room by provisioning a Daily.co room and inserting the room in Supabase.
* @returns The created room object
*/
export async function createPracticeRoom(
  supabaseAuthenticated: TypedSupabaseClient,
  newRoom: NewRoomBody
): Promise<PracticeRoom> {
  const { hostId, startUtc, private: isPrivate, durationMinutes } = newRoom;

  // Generate daily room for conference call
  const roomUrl = await createDailyRoom();

  // Generate calendar event id
  const icsUid = randomUUID();

  // Derive end time from start and duration
  const startIso = new Date(startUtc);
  const endUtc = new Date(startIso.getTime() + durationMinutes * 60 * 1000).toISOString();


  // Generate Room
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

  // Generate first round for room
  const roomId = roomData.id
  await createRoundWithReturn(supabaseAuthenticated, { roundNumber: 1, roomId })

  return roomData;
}


export async function updatePracticeRoomGuarded(
  supabaseAuthenticated: TypedSupabaseClient,
  _currentUserId: string,
  updateRoom: UpdatePracticeRoom
): Promise<PracticeRoom> {

  // Determine type of update (initial booking or reschedule)
  const isBooking = updateRoom.guestId !== undefined
  const isReschedule = updateRoom.startUtc != undefined

  // Retrieve room practice room to implement update guards
  const room = await getPracticeRoomById(supabaseAuthenticated, updateRoom.roomId);

  // Booking guard: Only bookable if no current guest
  if (isBooking) {
    if (room.guestId) {
      console.log('Error triggered')
      throw new HttpError(409, 'Session already booked');
    }
  }

  // Reschedule guard: only host can change startUtc; must be future
  if (isReschedule) {
    if (updateRoom.startUtc == null) {
      throw new HttpError(400, 'Invalid datetime');
    }
    const newDate = new Date(updateRoom.startUtc);
    if (isNaN(newDate.getTime())) {
      throw new HttpError(400, 'Invalid datetime');
    }
    const now = new Date();
    if (newDate.getTime() <= now.getTime()) {
      throw new HttpError(400, 'Please select a valid future date/time.');
    }
  }

  // If rescheduling, recompute updateRoom with new endUtc and bump icsSequence
  // Else update practice room with updateRoom as is
  let updateRoomValidated = updateRoom

  if (isReschedule) {
    const duration = room.durationMinutes
    const newStart = updateRoom.startUtc as string
    const newEnd = new Date(new Date(newStart).getTime() + duration * 60 * 1000).toISOString()
    updateRoomValidated = { ...updateRoomValidated, endUtc: newEnd, icsSequence: (room.icsSequence ?? 0) + 1 }
  }
  const updateRoomReturn = await updatePracticeRoomWithReturn(supabaseAuthenticated, updateRoomValidated);

  if (isNotificationReady(updateRoomReturn)) {
    // Send notification email for case when booking or reschedule. In case of reschedule, room passed will have new details
    await sendNotification('REQUEST', updateRoomReturn)
  }

  return updateRoomReturn;
}

/**
 * Delete a practice room and its rounds.
 * - Only the host can delete the session.
 * - Deletes dependent `practice_rounds` first, then `practice_rooms`.
 */
export async function deletePracticeRoomGuarded(
  supabaseAuthenticated: TypedSupabaseClient,
  _currentUserId: string,
  roomId: string
): Promise<{ deleted: true; roomId: string }> {

  const room = await getPracticeRoomById(supabaseAuthenticated, roomId);

  // Send CANCEL only if a guest had booked the session
  if (room.guestId && isNotificationReady(room)) {
    await sendNotification('CANCEL', room)
  }

  // Delete dependent rows first
  await deleteRoundsByRoomId(supabaseAuthenticated, roomId);
  // Then delete the room
  await deletePracticeRoomById(supabaseAuthenticated, roomId);

  return { deleted: true, roomId };
}