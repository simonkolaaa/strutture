// Valutazioni e riunioni sul calendario (ADR 0009, 0011), senza chiedere permessi su Google
// Calendar: un collegamento che apre Calendar con l'evento già compilato, oppure un file .ics
// con tutte quelle dell'anno da importare in qualsiasi calendario.

import { courseSlots, sortedCourses } from './calendar'
import { addDays, type ISODate } from './dates'
import { sortedMeetings } from './meetings'
import { activityLabel, type Activity, type Course, courseLabel, type Meeting, meetingLabel, type ProfclickData } from './model'

export interface CalendarEntry {
  uid: string
  date: ISODate
  /** "15:00" per un evento con l'ora; senza, l'evento è di un giorno intero. */
  time?: string
  title: string
  details: string
}

/** Una riunione senza orario di fine: si segnano due ore. */
const MEETING_HOURS = 2

function compact(date: ISODate): string {
  return date.replaceAll('-', '')
}

/** "20261002T150000", nell'ora locale; con l'ora di fine che non passa la mezzanotte. */
function dateTime(date: ISODate, time: string, plusHours = 0): string {
  const [h, m] = time.split(':').map(Number)
  const hours = Math.min(23, h + plusHours)
  return `${compact(date)}T${String(hours).padStart(2, '0')}${String(hours === h + plusHours ? m : 59).padStart(2, '0')}00`
}

export function assessmentEntry(data: ProfclickData, course: Course, date: ISODate, activity: Activity): CalendarEntry {
  const topics = activity.topicIds.map((id) => data.topics[id]?.title).filter(Boolean)
  return {
    uid: `${activity.id}@profclick.federicodiluca.com`,
    date,
    title: `${activityLabel(activity)} ${course.className}${topics.length ? `: ${topics.join(', ')}` : ''}`,
    details: [courseLabel(course), activity.text].filter(Boolean).join(' · '),
  }
}

export function meetingEntry(meeting: Meeting): CalendarEntry {
  return {
    uid: `${meeting.id}@profclick.federicodiluca.com`,
    date: meeting.date,
    time: meeting.time || undefined,
    title: meetingLabel(meeting),
    details: meeting.prep
      .filter((p) => p.text.trim())
      .map((p) => `- ${p.text}`)
      .join('\n'),
  }
}

/** Apre Google Calendar con l'evento già compilato: all'ora indicata o per il giorno intero. */
export function googleCalendarLink(entry: CalendarEntry): string {
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', entry.title)
  if (entry.time) {
    url.searchParams.set('dates', `${dateTime(entry.date, entry.time)}/${dateTime(entry.date, entry.time, MEETING_HOURS)}`)
    url.searchParams.set('ctz', 'Europe/Rome')
  } else url.searchParams.set('dates', `${compact(entry.date)}/${compact(addDays(entry.date, 1))}`)
  if (entry.details) url.searchParams.set('details', entry.details)
  return url.toString()
}

export function allAssessments(data: ProfclickData): CalendarEntry[] {
  return sortedCourses(data).flatMap((course) =>
    courseSlots(data, course).flatMap((slot) =>
      (slot.lesson?.cancelled ? [] : (slot.lesson?.activities ?? []))
        .filter((a) => a.kind === 'verifica' && a.assessment && !a.assessment.continues)
        .map((a) => assessmentEntry(data, course, slot.date, a)),
    ),
  )
}

export function allMeetings(data: ProfclickData): CalendarEntry[] {
  return sortedMeetings(data).map(meetingEntry)
}

function escape(text: string): string {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

/**
 * Il file .ics. Ogni evento ha un UID stabile: importandolo di nuovo, i calendari
 * aggiornano gli eventi invece di duplicarli.
 */
export function toIcs(entries: CalendarEntry[], stamp: Date): string {
  const now = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ProfClick//IT', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:ProfClick']
  for (const e of entries) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${now}`,
      // Con l'ora, nell'ora locale di chi importa; senza, un giorno intero che non occupa l'agenda.
      ...(e.time
        ? [`DTSTART:${dateTime(e.date, e.time)}`, `DTEND:${dateTime(e.date, e.time, MEETING_HOURS)}`]
        : [`DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`]),
      `SUMMARY:${escape(e.title)}`,
      ...(e.details ? [`DESCRIPTION:${escape(e.details)}`] : []),
      `TRANSP:${e.time ? 'OPAQUE' : 'TRANSPARENT'}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
