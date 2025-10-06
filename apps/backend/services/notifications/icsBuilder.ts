import { IcsMethod } from "../../types"

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
  startUtc: string
  endUtc: string
  summary: string
  organizer: { name?: string; email: string }
  attendees: Array<{ name?: string; email: string }>
  status?: 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE'
  description?: string
  location?: string
}

export function buildIcs(params: BuildIcsParams): string {
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


