import { format } from 'date-fns'
import type { SendNotificationParams, IcsMethod, PracticeRoom, BuildIcsParams } from '../types'
import { createAdminSupabaseClient } from '../utils/supabase'

const NOTIFICATIONS_ENABLED = (process.env.NOTIFICATIONS_ENABLED ?? 'false').toLowerCase() === 'true'

// types moved to ../types

/**
 * Provider-agnostic notification layer. In dark-launch mode (default), it logs payloads.
 * Integrate a real provider (e.g., Resend, SendGrid) behind NOTIFICATIONS_ENABLED.
 */
async function sendNotification (params: SendNotificationParams): Promise<{ logged: boolean; sent: boolean }>{
  console.log('Send notification')
  if (!NOTIFICATIONS_ENABLED) {
    console.log('[notification:dry-run]', JSON.stringify(params, null, 2))
    return { logged: true, sent: false }
  }
  // TODO: Wire real provider here
  console.log('[notification:send:stub]', JSON.stringify(params, null, 2))
  return { logged: false, sent: true }
}

// types moved to ../types

export async function sendIcsEmail(method: IcsMethod, room: PracticeRoom): Promise<void> {
  console.log('Send ICS Email')
  const ctx = await buildBookingContext(room)
  if (!ctx) return
  const icsText = buildIcs({
    uid: ctx.uid,
    method,
    startUtc: ctx.startUtc,
    endUtc: ctx.endUtc,
    summary: ctx.summary,
    organizer: ctx.organizer,
    attendees: ctx.attendees,
  })
  await sendNotification({
    to: ctx.attendees,
    subject: ctx.summary,
    text: method === 'CANCEL' ? 'Your session has been cancelled.' : 'You have a scheduled session.',
    ics: { filename: 'invite.ics', content: icsText },
  })
}

function toIcsDate(isoUtc: string): string {
  const d = new Date(isoUtc)
  return format(d, "yyyyMMdd'T'HHmmss'Z'")
}

function buildIcs(params: BuildIcsParams): string {
  const {
    uid,
    method,
    startUtc,
    endUtc,
    summary,
    organizer,
    attendees,
    status = 'CONFIRMED',
    description = '',
    location = 'Online',
  } = params

  const dtStamp = toIcsDate(new Date().toISOString())
  const dtStart = toIcsDate(startUtc)
  const dtEnd = toIcsDate(endUtc)

  const organizerLine = `ORGANIZER;CN=${organizer.name ?? organizer.email}:mailto:${organizer.email}`
  const attendeeLines = attendees
    .map(a => `ATTENDEE;CN=${a.name ?? a.email}:mailto:${a.email}`)
    .join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Ophthalmo AI Practice Hub//EN',
    'VERSION:2.0',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    organizerLine,
    attendeeLines,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    `STATUS:${status}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\n')
}

function escapeText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

async function buildBookingContext(room: PracticeRoom) {
  if (!room.datetimeUtc) return null
  const startUtc = room.datetimeUtc
  const endUtc = new Date(new Date(startUtc).getTime() + 60 * 60 * 1000).toISOString()
  const hostEmail = await safeGetEmail(room.hostId)
  const guestEmail = room.guestId ? await safeGetEmail(room.guestId) : null
  const attendees = [hostEmail, guestEmail].filter(Boolean).map(email => ({ email: email as string }))
  if (attendees.length === 0) return null
  const uid = room.icsUid ?? 'ephemeral-' + room.id
  const organizer = { email: hostEmail ?? attendees[0].email }
  return { uid, startUtc, endUtc, summary: 'Ophthalmo Practice Session', organizer, attendees }
}

async function safeGetEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null
  try { return await getUserEmailById(userId) } catch { return null }
}

async function getUserEmailById(userId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) {
    console.warn('[getUserEmailById] Failed to load user', userId, error.message)
    return null
  }
  return data?.user?.email ?? null
}

