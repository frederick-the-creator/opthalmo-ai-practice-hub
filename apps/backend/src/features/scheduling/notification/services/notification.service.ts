import type { BookedRoom, PracticeRoom } from '@/features/scheduling/practiceRoom/practiceRoom.types.js'
import { Resend } from 'resend'
import { buildIcs } from '@/features/scheduling/notification/services/buildNotification/icsBuilder.service.js'
import { buildBookingContext } from '@/features/scheduling/notification/services/buildNotification/bookingContextBuilder.service.js'
import type { Attendee, BookingContext } from '@/features/scheduling/notification/services/buildNotification/bookingContextBuilder.service.js'
import { createMagicToken } from '@/features/scheduling/notification/services/buildNotification/magicLink.service.js'
import type { IcsMethod } from '@/features/scheduling/notification/types/ics.types.js'



export type SendEmailParams = {
  to: Attendee
  subject: string
  text: string
  ics?: { filename: string, content: string }
  methodForCalendar?: IcsMethod
}

export type BuildEmailParams = {
	method: IcsMethod
	room: BookedRoom
	ctx: BookingContext
	attendee: Attendee
}

export function isNotificationReady(room: PracticeRoom): room is BookedRoom {
  return !!room.guestId && !!room.endUtc
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}


export async function buildEmail(params: BuildEmailParams): Promise<SendEmailParams>{

	const { method, room, ctx, attendee } = params
	const { host, guest } = ctx.attendees
	const isHost = attendee.email === host.email
	const counterparty = isHost ? guest.name : host.name
	const uid = ctx.icsUid

	// Build Subject for email and ics attachment - to include the other party's first name when available
	let subject = 'Ophthalmo Practice Session'

	if (counterparty) {
		subject = `Ophthalmo Practice Session with ${counterparty}`
	}

	let prefix: string | null = null
	if (method === 'CANCEL') {
		prefix = 'Cancelled'
	}
	if (method === 'REQUEST') {
		prefix = (ctx.sequence ?? 0) > 0 ? 'New Time Proposed' : 'Booked'
	}
	subject = `${prefix}: ${subject}`

	// Build Body - description with tokenized reschedule link for REQUESTs
	const bodyBase = method === 'CANCEL' ? 'Your session has been cancelled.' : 'You have a scheduled session.'
	let rescheduleLink: string | null = null

	if (method === 'REQUEST') { // For case when notification is an initial booking or reschedule, generate a reschedule link
		const { token } = await createMagicToken({
			purpose: 'reschedule_propose',
			uid,
			roomId: room.id,
			actorEmail: attendee.email,
			actorRole: isHost ? 'host' : 'guest',
		})

		const linkBase = process.env.FRONTEND_URL?.replace(/\/$/, '')
		rescheduleLink = `${linkBase}/reschedule?r=${encodeURIComponent(token)}`
	}

	const body = method === 'REQUEST' && rescheduleLink
		? `${bodyBase}\n\nIf you need to reschedule, use this link: ${rescheduleLink}`
		: bodyBase

	// Build Calendar invite attachment
	const ics = buildIcs({
		uid,
		sequence: ctx.sequence,
		method: method,
		startUtc: ctx.startUtc,
		endUtc: ctx.endUtc,
		summary: subject,
		description: body,
		organizer: ctx.organizer,
		attendee: attendee,
	})

	return {
		to: attendee,
		subject,
		text: body,
		ics: { filename: 'invite.ics', content: ics },
		methodForCalendar: method,
	}
}

/**
 * Low-level email sender using Resend. No feature gating here.
 */
export async function sendEmailWithRetry (params: SendEmailParams): Promise<void>{

	const { to, subject, text, ics, methodForCalendar } = params

	// Load environment variables
	const resendApiKey = process.env.RESEND_API_KEY
	const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL

	if (!resendApiKey) {
		throw new Error('RESEND_API_KEY is required')
	}
	if (!fromEmail) {
		throw new Error('NOTIFICATIONS_FROM_EMAIL is required')
	}

	// Build resend object and list of recipient emails
	const resend = new Resend(resendApiKey)
	const toEmail = to.email


	// Create email attachment ICS
	const attachments = ics
		? [{
			filename: ics.filename,
			content: Buffer.from(ics.content, 'utf8'),
			contentType: `text/calendar; method=${methodForCalendar ?? 'REQUEST'}; charset=UTF-8`,
			}]
		: undefined


	const maxAttempts = 3
	let attempt = 0
	while (true) {
		attempt++
		try {
			// Try sending email and if true trigger return to exit loop
			const result = await resend.emails.send({
				from: fromEmail,
				to: toEmail,
				subject: subject,
				text: text,
				attachments,
			})

			if (result.error) {
				throw new Error(result.error?.message || 'Error sending email')
			}

			return

		} catch (err: unknown) {

			if (attempt >= maxAttempts) {
				throw err
			}

			const backoffMs = 500 * Math.pow(2, attempt - 1)
			await sleep(backoffMs)

		}
	}
}


export async function sendNotification(method: IcsMethod, room: BookedRoom): Promise<void> {

	// Build booking context from room to obtain necessary details for sending notification
	const ctx = await buildBookingContext(room)

	// Feature gate: when notifications are disabled, just log the intent and return
	const NOTIFICATIONS_ENABLED = (process.env.NOTIFICATIONS_ENABLED ?? 'false').toLowerCase() === 'true'
	if (!NOTIFICATIONS_ENABLED) {
		const safe = { attendees: ctx.attendees, method, has_ics: true }
		console.log('[notification:dry-run:ics]', JSON.stringify(safe))
		return
	}

	// Send separate emails to each attendee, with an ICS that only lists that attendee
	for (const attendee of Object.values(ctx.attendees)) {
		const email = await buildEmail({method, room, ctx, attendee})
		await sendEmailWithRetry(email)
	}
}