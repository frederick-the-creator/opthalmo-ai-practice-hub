import { IcsMethod } from "@/features/scheduling/notification/types/ics.types.js"
import { Attendee } from "@/features/scheduling/notification/services/buildNotification/bookingContextBuilder.service.js"


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

function escapeText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

export type BuildIcsParams = {
  uid: string
  method: IcsMethod
  sequence: number
  startUtc: string
  endUtc: string
  summary: string
  organizer: Attendee
  attendee: Attendee
  description: string
}

export function buildIcs(params: BuildIcsParams): string {
  const {
    uid,
    method,
    sequence,
    startUtc,
    endUtc,
    summary,
    organizer,
    attendee,
    description
  } = params

  const status = 'CONFIRMED'
  const location = 'Online'

  const dtStamp = toIcsDate(new Date().toISOString())
  const dtStart = toIcsDate(startUtc)
  const dtEnd = toIcsDate(endUtc)

  const organizerLine = `ORGANIZER;CN=${organizer.name ?? organizer.email}:mailto:${organizer.email}`
  const attendeeLine = `ATTENDEE;CN=${attendee.name ?? attendee.email}:mailto:${attendee.email}`

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Ophthalmo AI Practice Hub//EN',
    'VERSION:2.0',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    organizerLine,
    attendeeLine,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    `STATUS:${status}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\n')
}


