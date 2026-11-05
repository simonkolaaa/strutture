// L'orario di tutte le classi in una settimana, in una griglia giorni × ore di scuola, da
// stampare o tenere sul telefono. Si ricava dalle lezioni di quella settimana, come nella
// Settimana: l'orario in vigore giorno per giorno, più le lezioni cambiate a mano (ADR 0018),
// le lezioni in più, le festività. Con l'ora d'inizio una lezione va nella sua riga, senza
// resta nel giorno, in ordine; le lezioni senza giorno fisso (ADR 0008) si elencano a parte.

import { courseSlots, holidayOn, sortedCourses } from './calendar'
import { addDays, type ISODate, startOfWeek, weekday } from './dates'
import { type Course, type ProfclickData, scheduleAt } from './model'

export interface TimetableEntry {
  course: Course
  /** Il giorno della lezione: aprendola, si cambia lì. */
  date: ISODate
  hours: number
  lab: boolean
  /** Lezione saltata: resta nella griglia, barrata. */
  cancelled: boolean
}

export interface Timetable {
  /** I giorni con almeno una lezione, da lunedì (1) a sabato (6); sempre da lunedì a venerdì. */
  days: number[]
  /** Quante ore di scuola mostrare: fino all'ultima occupata. */
  rows: number
  /** Per giorno e ora di scuola, la lezione che inizia lì. */
  cells: Map<string, TimetableEntry>
  /** Per giorno, le lezioni senza ora d'inizio, in ordine. */
  unplaced: Map<number, TimetableEntry[]>
  /** Le lezioni senza giorno fisso, per classe. */
  floating: TimetableEntry[]
  /** Per giorno, la festività che lo occupa. */
  holidays: Map<number, string>
}

export function cellKey(day: number, hour: number): string {
  return `${day}-${hour}`
}

/** L'orario della settimana che contiene `date`. */
export function timetable(data: ProfclickData, date: ISODate): Timetable {
  const monday = startOfWeek(date)
  const cells = new Map<string, TimetableEntry>()
  const unplaced = new Map<number, TimetableEntry[]>()
  const floating: TimetableEntry[] = []
  const holidays = new Map<number, string>()
  const occupied = new Set<string>()
  const days = new Set([1, 2, 3, 4, 5])
  let rows = 0

  const place = (day: number, start: number | undefined, entry: TimetableEntry) => {
    days.add(day)
    if (!start) {
      unplaced.set(day, [...(unplaced.get(day) ?? []), entry])
      return
    }
    const span = Array.from({ length: Math.ceil(entry.hours) }, (_, i) => cellKey(day, start + i))
    // Due classi alla stessa ora (orario sbagliato o classi articolate): la seconda va tra quelle senza ora.
    if (span.some((key) => occupied.has(key))) unplaced.set(day, [...(unplaced.get(day) ?? []), entry])
    else {
      cells.set(span[0], entry)
      span.forEach((key) => occupied.add(key))
      rows = Math.max(rows, start + span.length - 1)
    }
  }

  if (data.year) {
    for (let i = 0; i < 6; i++) {
      const holiday = holidayOn(data.year, addDays(monday, i))
      if (holiday) holidays.set(i + 1, holiday.name)
    }
  }

  for (const course of sortedCourses(data)) {
    for (const slot of courseSlots(data, course, monday, addDays(monday, 6))) {
      const lesson = slot.lesson
      const entry = { course, date: slot.date, hours: slot.hours, lab: slot.lab, cancelled: Boolean(lesson?.cancelled) }
      if (slot.floating) {
        floating.push(entry)
        continue
      }
      const day = weekday(slot.date)
      const changed = lesson && (lesson.extra || lesson.hours !== undefined || lesson.start !== undefined || lesson.lab !== undefined)
      if (changed) {
        place(day, slot.start, entry)
        continue
      }
      // Come da orario: le lezioni dello stesso giorno restano separate, ognuna alla sua ora.
      for (const s of scheduleAt(course, slot.date).filter((s) => s.day === day && s.hours > 0)) {
        place(day, s.start, { ...entry, hours: s.hours, lab: s.lab })
      }
    }
  }
  return { days: [...days].sort(), rows, cells, unplaced, floating, holidays }
}
