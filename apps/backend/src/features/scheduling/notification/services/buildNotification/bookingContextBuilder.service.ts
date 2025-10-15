import { getUserEmailById, getUserFirstNameById } from '@/features/scheduling/notification/services/buildNotification/adminRetrieveUsers.service.js'
import { BookedRoom } from '@/features/scheduling/practiceRoom/practiceRoom.types.js';

export type Attendee = {
	email: string,
	name?: string
}

export type BookingContext = {
  icsUid: string,
  startUtc: string,
  endUtc: string,
  sequence: number,
  organizer: Attendee,
  attendees: {
    host: Attendee,
    guest: Attendee
  }
}

export function resolveOrganizerFromEnv(): { name?: string; email: string } {
  const from = process.env.NOTIFICATIONS_FROM_EMAIL
  if (!from) {
    throw new Error('Missing environment variable NOTIFICATIONS_FROM_EMAIL')
  }

  const match = from.match(/^(.*)<(.+?)>\s*$/)

  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '')
    const email = match[2].trim()
    return { name: name || undefined, email }
  }

  return { name: undefined, email: from }
}

async function safeGetEmail(userId: string): Promise<string> {
  return await getUserEmailById(userId)
}

export async function buildBookingContext(room: BookedRoom): Promise<BookingContext> {
  
  // Retrieve room details
  // Retrieve attendee details
  const [hostEmail, hostFirst] = await Promise.all([
    safeGetEmail(room.hostId), 
    getUserFirstNameById(room.hostId)
  ])
  const [guestEmail, guestFirst] = await Promise.all([
    safeGetEmail(room.guestId), 
    getUserFirstNameById(room.guestId)
  ])
  const attendees = {
    host: { email: hostEmail, name: hostFirst },
    guest: { email: guestEmail, name: guestFirst},
  }
  
  // Retrieve other details for email
  const organizer = resolveOrganizerFromEnv()
  const sequence = room.icsSequence ?? 0

  return {
    icsUid: room.icsUid,
    startUtc: room.startUtc,
    endUtc: room.endUtc,
    sequence,
    organizer,
    attendees
  }
}