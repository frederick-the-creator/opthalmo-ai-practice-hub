import type { PracticeRoom } from '../../types'
import { getUserEmailById } from './adminRetrieveUsers'

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
  if (!room.datetimeUtc) return null
  const startUtc = room.datetimeUtc
  const endUtc = new Date(new Date(startUtc).getTime() + 60 * 60 * 1000).toISOString()
  const hostEmail = await safeGetEmail(room.hostId)
  const guestEmail = room.guestId ? await safeGetEmail(room.guestId) : null
  const attendees = [hostEmail, guestEmail].filter(Boolean).map(email => ({ email: email as string }))
  if (attendees.length === 0) return null
  const uid = room.icsUid ?? 'ephemeral-' + room.id
  const organizer = resolveOrganizerFromEnv()
  if (!guestEmail) {
    console.warn('[notification] guest email not found for room', room.id)
  }
  if (!hostEmail) {
    console.warn('[notification] host email not found for room', room.id)
  }
  return { uid, startUtc, endUtc, summary: 'Ophthalmo Practice Session', organizer, attendees }
}


