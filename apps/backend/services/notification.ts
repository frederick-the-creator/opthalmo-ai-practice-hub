import type { SendNotificationParams, IcsMethod, PracticeRoom, BuildIcsParams } from '../types'
import { createAdminSupabaseClient } from '../utils/supabase'
import { Resend } from 'resend'

const NOTIFICATIONS_ENABLED = (process.env.NOTIFICATIONS_ENABLED ?? 'false').toLowerCase() === 'true'

// types moved to ../types

/**
 * Provider-agnostic notification layer. In dark-launch mode (default), it logs payloads.
 * Integrate a real provider (e.g., Resend, SendGrid) behind NOTIFICATIONS_ENABLED.
 */
async function sendNotification (params: SendNotificationParams): Promise<{ logged: boolean; sent: boolean }>{
  if (!NOTIFICATIONS_ENABLED) {
    const safe = { to_count: params.to.length, subject: params.subject, has_ics: Boolean(params.ics) }
    console.log('[notification:dry-run]', JSON.stringify(safe))
    return { logged: true, sent: false }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is required when NOTIFICATIONS_ENABLED=true')
  }
  if (!fromEmail) {
    throw new Error('NOTIFICATIONS_FROM_EMAIL is required when NOTIFICATIONS_ENABLED=true')
  }

  const resend = new Resend(resendApiKey)
  let toList = params.to.map((t) => (t.name ? `${t.name} <${t.email}>` : t.email))
  const redirectTo = process.env.NOTIFICATIONS_REDIRECT_TO
  if (redirectTo) {
    console.warn('[notification] Redirecting outgoing email', { redirectTo, original_count: params.to.length })
    toList = [redirectTo]
  }
  const attachments = params.ics
    ? [{
        filename: params.ics.filename,
        content: Buffer.from(params.ics.content, 'utf8'),
        contentType: 'text/calendar; charset=UTF-8',
      }]
    : undefined

  const maxAttempts = 3
  let attempt = 0
  // Basic retries with exponential backoff
  // Intentionally minimal to avoid hiding persistent failures
  // Logs each attempt for observability
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt++
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: toList,
        subject: params.subject,
        text: params.text,
        attachments,
      })
      if (result.error) {
        const message = result.error?.message || 'Unknown provider error'
        console.warn(`[notification:provider-error] attempt=${attempt}`, message)
        throw new Error(message)
      }
      console.log(`[notification:sent] attempt=${attempt}`, JSON.stringify({ id: result?.data?.id ?? null }, null, 2))
      return { logged: false, sent: true }
    } catch (err: any) {
      console.warn(`[notification:error] attempt=${attempt}`, err?.message || err)
      if (attempt >= maxAttempts) {
        throw err
      }
      const backoffMs = 500 * Math.pow(2, attempt - 1)
      await sleep(backoffMs)
    }
  }
}

// types moved to ../types

export async function sendIcsEmail(method: IcsMethod, room: PracticeRoom): Promise<void> {
  const ctx = await buildBookingContext(room)
  if (!ctx) return

  const baseText = method === 'CANCEL' ? 'Your session has been cancelled.' : 'You have a scheduled session.'

  // Send separate emails to each attendee, with an ICS that only lists that attendee
  for (const attendee of ctx.attendees) {
    const icsText = buildIcs({
      uid: ctx.uid,
      method,
      startUtc: ctx.startUtc,
      endUtc: ctx.endUtc,
      summary: ctx.summary,
      organizer: ctx.organizer,
      attendees: [attendee],
    })
    await sendNotification({
      to: [attendee],
      subject: ctx.summary,
      text: baseText,
      ics: { filename: 'invite.ics', content: icsText },
    })
  }
}

function toIcsDate(isoUtc: string): string {
  const d = new Date(isoUtc)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  const MM = pad(d.getUTCMonth() + 1)
  const DD = pad(d.getUTCDate())
  const HH = pad(d.getUTCHours())
  const mm = pad(d.getUTCMinutes())
  const ss = pad(d.getUTCSeconds())
  return `${yyyy}${MM}${DD}T${HH}${mm}${ss}Z`
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
  const organizer = resolveOrganizerFromEnv()
  if (!guestEmail) {
    console.warn('[notification] guest email not found for room', room.id)
  }
  if (!hostEmail) {
    console.warn('[notification] host email not found for room', room.id)
  }
  return { uid, startUtc, endUtc, summary: 'Ophthalmo Practice Session', organizer, attendees }
}

async function safeGetEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null
  try { return await getUserEmailById(userId) } catch (e: any) {
    console.warn('[notification] failed to resolve email for user', userId, e?.message)
    return null
  }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveOrganizerFromEnv(): { name?: string; email: string } {
  const from = process.env.NOTIFICATIONS_FROM_EMAIL ?? 'Ophthalmo Practice <no-reply@localhost>'
  const match = from.match(/^(.*)<(.+?)>\s*$/)
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '')
    const email = match[2].trim()
    return { name: name || undefined, email }
  }
  return { name: undefined, email: from }
}

