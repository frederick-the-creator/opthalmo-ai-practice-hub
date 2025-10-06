import type { IcsMethod, PracticeRoom } from '../../types'
import { Resend } from 'resend'
import { buildIcs } from './icsBuilder'
import { buildBookingContext } from './bookingContextBuilder'

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
async function sendEmail (params: SendEmailParams): Promise<{ logged: boolean; sent: boolean }>{

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

export async function sendIcsNotification(method: IcsMethod, room: PracticeRoom): Promise<void> {
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
    await sendEmail({
      to: [attendee],
      subject: ctx.summary,
      text: baseText,
      ics: { filename: 'invite.ics', content: icsText },
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

