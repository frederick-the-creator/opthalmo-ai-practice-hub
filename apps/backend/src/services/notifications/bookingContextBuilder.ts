import type { PracticeRoom } from '@/features/practiceRoom/practiceRoom.types.js'
import { getUserEmailById, getUserFirstNameById } from '@/adminRetrieveUsers.js'

export function resolveOrganizerFromEnv(): { name?: string; email: string } {
  const from = process.env.NOTIFICATIONS_FROM_EMAIL ?? 'Ophthalmo Practice <no-reply@localhost>'
  const match = from.match(/^(.*)<(.+?)>\s*$/)
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '')
    const email = match[2].trim()
    return { name: name || undefined, email }
  }
  return { name: undefined, email: from }
}

async function safeGetEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null
  try { return await getUserEmailById(userId) } catch (e: any) {
    console.warn('[notification] failed to resolve email for user', userId, e?.message)
    return null
  }
}

export async function buildBookingContext(room: PracticeRoom) {
  if (!room.startUtc) return null
  const startUtc = room.startUtc
  const endUtc = room.endUtc
  if (!endUtc) return null
  const hostEmail = await safeGetEmail(room.hostId)
  const guestEmail = room.guestId ? await safeGetEmail(room.guestId) : null
  const hostFirst = await getUserFirstNameById(room.hostId)
  const guestFirst = room.guestId ? await getUserFirstNameById(room.guestId) : null
  const attendees = [
    hostEmail ? { email: hostEmail as string, name: hostFirst ?? undefined } : null,
    guestEmail ? { email: guestEmail as string, name: guestFirst ?? undefined } : null,
  ].filter(Boolean) as Array<{ email: string; name?: string }>
  if (attendees.length === 0) return null
  const uid = room.icsUid ?? 'ephemeral-' + room.id
  const organizer = resolveOrganizerFromEnv()
  const sequence = room.icsSequence ?? 0
  // Include generic reschedule landing link for convenience; tokenized link is added per email
  const base = (process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:5173')
  const description = `Practice session via Ophthalmo Practice Hub.\n\nIf you need to reschedule, visit: ${base}/reschedule\n\nThis event is managed by a central organizer.`
  if (!guestEmail) {
    console.warn('[notification] guest email not found for room', room.id)
  }
  if (!hostEmail) {
    console.warn('[notification] host email not found for room', room.id)
  }
  return {
    uid,
    sequence,
    startUtc,
    endUtc,
    summary: 'Ophthalmo Practice Session',
    description,
    organizer,
    attendees,
    hostFirst,
    guestFirst,
    hostEmail,
    guestEmail,
  }
}


