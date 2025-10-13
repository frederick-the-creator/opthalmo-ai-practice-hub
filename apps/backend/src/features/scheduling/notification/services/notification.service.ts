import type { IcsMethod, PracticeRoom } from '@/features/scheduling/practiceRoom/practiceRoom.types.js'
import { Resend } from 'resend'
import { buildIcs } from '@/features/scheduling/notification/services/icsBuilder.service.js'
import { buildBookingContext } from '@/features/scheduling/notification/services/bookingContextBuilder.service.js'
import { issueMagicLink } from '@/features/scheduling/notification/services/magicLink.service.js'
import { createAdminSupabaseClient } from '@/utils/supabaseClient.js'
import { claimSend, markSendSent, incrementAttemptAndFail } from '@/features/scheduling/notification/repos/notification.repo.js'

const NOTIFICATIONS_ENABLED = (process.env.NOTIFICATIONS_ENABLED ?? 'false').toLowerCase() === 'true'

export type SendEmailParams = {
  to: Array<{ email: string, name?: string }>
  subject: string
  text: string
  ics?: { filename: string, content: string }
}

/**
 * Low-level email sender using Resend. No feature gating here.
 */
export async function sendEmail (params: SendEmailParams & { methodForCalendar?: IcsMethod }): Promise<{ logged: boolean; sent: boolean; providerMessageId: string | null }>{

  // Load environment variables
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is required when NOTIFICATIONS_ENABLED=true')
  }
  if (!fromEmail) {
    throw new Error('NOTIFICATIONS_FROM_EMAIL is required when NOTIFICATIONS_ENABLED=true')
  }

  // Build resend object and list of recipient emails
  const resend = new Resend(resendApiKey)
  let toList = params.to.map((t) => (t.name ? `${t.name} <${t.email}>` : t.email))

  // Load redirect email from env for testing case
  const redirectTo = process.env.NOTIFICATIONS_REDIRECT_TO
  if (redirectTo) {
    console.warn('[notification] Redirecting outgoing email', { redirectTo, original_count: params.to.length })
    toList = [redirectTo]
  }
  
  // Create email attachment ICS
  const attachments = params.ics
    ? [{
        filename: params.ics.filename,
        content: Buffer.from(params.ics.content, 'utf8'),
        contentType: `text/calendar; method=${params.methodForCalendar ?? 'REQUEST'}; charset=UTF-8`,
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
      // Try sending email and if true trigger return to exit loop
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
      const providerMessageId = result?.data?.id ?? null
      console.log(`[notification:sent] attempt=${attempt}`, JSON.stringify({ id: providerMessageId }, null, 2))
      return { logged: false, sent: true, providerMessageId }
    } catch (err: any) {
      // If email send is unsuccessful, sleep and then re-iterate loop
      console.warn(`[notification:error] attempt=${attempt}`, err?.message || err)
      if (attempt >= maxAttempts) {
        throw err
      }
      const backoffMs = 500 * Math.pow(2, attempt - 1)
      await sleep(backoffMs)
    }
  }
}

export async function sendIcsNotification(method: IcsMethod, room: PracticeRoom): Promise<void> {
  // Build booking context from room to obtain necessary details for sending notification
  const ctx = await buildBookingContext(room)
  if (!ctx) return

  const baseText = method === 'CANCEL' ? 'Your session has been cancelled.' : 'You have a scheduled session.'

  // Feature gate: when disabled, just log the intent and return
  if (!NOTIFICATIONS_ENABLED) {
    const safe = { attendees: ctx.attendees.length, subject: ctx.summary, method, has_ics: true }
    console.log('[notification:dry-run:ics]', JSON.stringify(safe))
    return
  }

  // Send separate emails to each attendee, with an ICS that only lists that attendee
  const admin = createAdminSupabaseClient()
  for (const attendee of ctx.attendees) {
    // Per-recipient subject: always include the other party's first name when available
    let subject = ctx.summary
    const isHost = attendee.email === ctx.hostEmail
    const counterpartyFirst = isHost ? ctx.guestFirst : ctx.hostFirst
    if (counterpartyFirst) {
      subject = `Ophthalmo Practice Session with ${counterpartyFirst}`
    }
    // Prepend notification type
    let prefix: string | null = null
    if (method === 'CANCEL') prefix = 'Cancelled'
    if (method === 'REQUEST') prefix = (ctx.sequence ?? 0) > 0 ? 'New Time Proposed' : 'Booked'
    if (prefix) subject = `${prefix}: ${subject}`
    // Build per-recipient description with tokenized reschedule link for REQUESTs
    let description = ctx.description
    let rescheduleLink: string | null = null

    // For case when notification is an initial booking or reschedule, send a reschedule link
    if (method === 'REQUEST') {
      try {
        const { token } = await issueMagicLink({
          purpose: 'reschedule_propose',
          uid: ctx.uid,
          roomId: (room as any).id ?? null,
          actorEmail: attendee.email,
          actorRole: isHost ? 'host' : 'guest',
          ttlSeconds: 60 * 60 * 24 * 7, // 7 days
        })
        const base = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:5173'
        rescheduleLink = `${base}/reschedule?r=${encodeURIComponent(token)}`
        description = `Practice session via Ophthalmo Practice Hub.\n\nIf you need to reschedule, use this link: ${rescheduleLink}\n\nThis event is managed by a central organizer.`
      } catch (e) {
        // Fallback to default description on failure
      }
    }

    // Build Calendar invite attachment
    const icsText = buildIcs({
      uid: ctx.uid,
      sequence: ctx.sequence,
      method,
      startUtc: ctx.startUtc,
      endUtc: ctx.endUtc,
      summary: subject,
      description,
      organizer: ctx.organizer,
      attendees: [attendee],
    })

    // Build text for body of email
    const emailText = method === 'REQUEST' && rescheduleLink
      ? `${baseText}\n\nIf you need to reschedule, use this link: ${rescheduleLink}`
      : baseText

    // Upsert record of notification to supabase or return record if already exists
    const key = { uid: ctx.uid, sequence: ctx.sequence, attendeeEmail: attendee.email, method }
    const { alreadySent, row } = await claimSend(admin as any, key)

    // If the notification has already been sent, move on to next loop iteration (next attendee)
    if (alreadySent) {
      console.log('[notification:idempotent-skip]', JSON.stringify({ uid: ctx.uid, sequence: ctx.sequence, method, attendee: attendee.email }))
      continue
    }
    console.log('[notification:send:start]', JSON.stringify({ uid: ctx.uid, sequence: ctx.sequence, method, attendee: attendee.email }))

    // Send email via Resend with multiple retries and exponential backoff
    try {
      const result = await sendEmail({
        to: [attendee],
        subject,
        text: emailText,
        ics: { filename: 'invite.ics', content: icsText },
        methodForCalendar: method,
      })

      // Update notification record to mark as sent
      await markSendSent(admin as any, row.id, result.providerMessageId)
      console.log('[notification:send:success]', JSON.stringify({ uid: ctx.uid, sequence: ctx.sequence, method, attendee: attendee.email, providerMessageId: result.providerMessageId }))
    } catch (e: any) {
      const message = e?.message || String(e)

      // Update notification record to mark as failed and increment number of attempts 
      await incrementAttemptAndFail(admin as any, row.id, message)
      console.warn('[notification:send:failed]', JSON.stringify({ uid: ctx.uid, sequence: ctx.sequence, method, attendee: attendee.email, error: message }))
      throw e
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

