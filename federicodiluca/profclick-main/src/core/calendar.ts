// I giorni di lezione di una classe, ricavati dall'orario settimanale e dal calendario
// scolastico. Non si salvano: cambiando l'orario o aggiungendo un ponte, le lezioni si
// ricalcolano da sole. Ogni giorno segue l'orario in vigore quel giorno (scheduleAt): un
// cambio d'orario non sposta le lezioni già passate.
//
// Le lezioni senza giorno (ADR 0008) si mettono nei giorni liberi della settimana, in
// ordine: la prima il lunedì, la seconda il martedì, … Il giorno è solo un segnaposto (non
// si mostra), ma così una festività in settimana toglie una lezione, come succede davvero.

import { addDays, eachDay, inRange, startOfWeek, weekday, type ISODate } from './dates'
import { type Course, type Lesson, lessonKey, type Period, type ProfclickData, scheduleAt, type ScheduleSlot, type SchoolYear } from './model'

export interface LessonSlot {
  courseId: string
  date: ISODate
  hours: number
  /** In laboratorio o con l'ITP. */
  lab: boolean
  /** Lezione senza giorno fisso: la data è un segnaposto nella sua settimana. */
  floating: boolean
  /** Posizione nella settimana, da 1: "lezione 2". */
  index: number
  /** L'ora di scuola in cui inizia, se indicata nell'orario. */
  start?: number
  /** Il piano di quel giorno, se ce n'è uno. */
  lesson?: Lesson
  /** Aggiunta a mano, fuori dall'orario. */
  extra?: boolean
}

interface DaySlot {
  hours: number
  lab: boolean
  floating: boolean
  index: number
  start?: number
}

/** La settimana tipo di un orario, giorno per giorno. */
export function weekPattern(schedule: ScheduleSlot[]): Map<number, DaySlot> {
  const pattern = new Map<number, DaySlot>()
  // Più lezioni nello stesso giorno diventano una sola, con le ore sommate.
  for (const slot of schedule) {
    if (slot.day === null || slot.hours <= 0) continue
    const current = pattern.get(slot.day)
    const start = Math.min(current?.start ?? Infinity, slot.start ?? Infinity)
    pattern.set(slot.day, {
      hours: (current?.hours ?? 0) + slot.hours,
      lab: Boolean(current?.lab) || slot.lab,
      floating: false,
      index: 0,
      ...(start < Infinity && { start }),
    })
  }
  let day = 1
  for (const slot of schedule) {
    if (slot.day !== null || slot.hours <= 0) continue
    while (pattern.has(day) && day < 6) day++
    const current = pattern.get(day)
    pattern.set(day, { hours: (current?.hours ?? 0) + slot.hours, lab: Boolean(current?.lab) || slot.lab, floating: true, index: 0 })
  }
  // Numerazione delle lezioni nella settimana, nell'ordine dei giorni.
  ;[...pattern.keys()].sort().forEach((d, i) => (pattern.get(d)!.index = i + 1))
  return pattern
}

export function hasFloatingLessons(course: Course): boolean {
  return [course.schedule, ...course.pastSchedules.map((p) => p.schedule)].some((schedule) => schedule.some((s) => s.day === null && s.hours > 0))
}

export function holidayOn(year: SchoolYear, date: ISODate) {
  return year.holidays.find((h) => inRange(date, h.from, h.to))
}

export function periodOf(year: SchoolYear, date: ISODate): Period | undefined {
  return year.periods.find((p) => inRange(date, p.start, p.end))
}

/** Il periodo in corso, o il più vicino se oggi è fuori dall'anno. */
export function currentPeriod(year: SchoolYear, date: ISODate): Period | undefined {
  return periodOf(year, date) ?? (date < year.start ? year.periods[0] : year.periods.at(-1))
}

/**
 * Le lezioni di una classe in un intervallo, in ordine di data. Le lezioni annullate
 * restano nell'elenco (si vedono, barrate) ma non contano come ore disponibili.
 */
export function courseSlots(data: ProfclickData, course: Course, from?: ISODate, to?: ISODate): LessonSlot[] {
  const year = data.year
  if (!year) return []
  const start = from && from > year.start ? from : year.start
  const end = to && to < year.end ? to : year.end
  const patterns = new Map<ScheduleSlot[], Map<number, DaySlot>>()
  const slots: LessonSlot[] = []
  for (const date of eachDay(start, end)) {
    const schedule = scheduleAt(course, date)
    const pattern = patterns.get(schedule) ?? patterns.set(schedule, weekPattern(schedule)).get(schedule)!
    const day = pattern.get(weekday(date))
    if (!day || holidayOn(year, date)) continue
    const lesson = data.lessons[lessonKey(course.id, date)]
    if (lesson?.removed || lesson?.extra) continue
    slots.push({ courseId: course.id, date, ...day, ...overrides(lesson), lesson })
  }
  // Le lezioni in più stanno dove le si è messe, anche fuori dall'orario o in un giorno di vacanza.
  const extra = Object.values(data.lessons).filter((l) => l.extra && l.courseId === course.id && l.date >= start && l.date <= end)
  if (extra.length === 0) return slots
  for (const lesson of extra) {
    slots.push({ courseId: course.id, date: lesson.date, hours: 1, lab: false, floating: false, index: 0, ...overrides(lesson), lesson, extra: true })
  }
  return slots.sort((a, b) => a.date.localeCompare(b.date))
}

/** Ore, ora d'inizio e ITP cambiati a mano su una lezione. */
function overrides(lesson: Lesson | undefined): Partial<LessonSlot> {
  if (!lesson) return {}
  return {
    ...(lesson.hours !== undefined && { hours: lesson.hours }),
    ...(lesson.start !== undefined && { start: lesson.start }),
    ...(lesson.lab !== undefined && { lab: lesson.lab }),
    // Spostata a un giorno preciso: non è più una lezione senza giorno.
    ...(lesson.extra && { floating: false }),
  }
}

export function periodSlots(data: ProfclickData, course: Course, period: Period): LessonSlot[] {
  return courseSlots(data, course, period.start, period.end)
}

export function isAvailable(slot: LessonSlot): boolean {
  return !slot.lesson?.cancelled
}

export function sortedCourses(data: ProfclickData): Course[] {
  return Object.values(data.courses).sort((a, b) => a.order - b.order || a.className.localeCompare(b.className))
}

/** Tutte le lezioni con un giorno vero, di tutte le classi, in un giorno. */
export function slotsOn(data: ProfclickData, date: ISODate): LessonSlot[] {
  // Con l'ora d'inizio, la giornata va in ordine; senza, le classi restano nel loro ordine, dopo.
  return sortedCourses(data)
    .flatMap((c) => courseSlots(data, c, date, date))
    .filter((s) => !s.floating)
    .sort((a, b) => (a.start ?? 99) - (b.start ?? 99))
}

/** Le lezioni senza giorno fisso della settimana che inizia dal lunedì indicato. */
export function floatingSlotsOfWeek(data: ProfclickData, monday: ISODate): LessonSlot[] {
  const sunday = addDays(startOfWeek(monday), 6)
  return sortedCourses(data)
    .filter(hasFloatingLessons)
    .flatMap((c) => courseSlots(data, c, monday, sunday))
    .filter((s) => s.floating)
}

/**
 * Le settimane di scuola di un periodo (il lunedì di ognuna): quelle con almeno un giorno da
 * lunedì a sabato fuori dalle vacanze. Misurano il periodo meglio dei giorni, che contano anche
 * le vacanze di Natale.
 */
export function schoolWeeks(year: SchoolYear, period: Period): ISODate[] {
  const weeks: ISODate[] = []
  for (const date of eachDay(period.start, period.end)) {
    const monday = startOfWeek(date)
    if (weekday(date) === 7 || holidayOn(year, date) || weeks.at(-1) === monday) continue
    weeks.push(monday)
  }
  return weeks
}

/** Per ogni periodo, le settimane di scuola e quelle già passate a una data. */
export function weeksPassed(year: SchoolYear, date: ISODate): { period: Period; weeks: number; passed: number }[] {
  const monday = startOfWeek(date)
  return year.periods.map((p) => {
    const weeks = schoolWeeks(year, p)
    return { period: p, weeks: weeks.length, passed: date > p.end ? weeks.length : weeks.filter((w) => w < monday).length }
  })
}

/**
 * L'ultimo giorno di scuola della settimana, ricavato dall'orario: il sabato se qualche classe
 * ha lezione il sabato, altrimenti il venerdì. Senza giorni nell'orario non si sa, e vale il sabato.
 */
export function lastSchoolDay(data: ProfclickData): number {
  const days = Object.values(data.courses).flatMap((c) => c.schedule.filter((s) => s.hours > 0 && s.day !== null).map((s) => s.day!))
  return days.length ? Math.max(5, ...days) : 6
}

/**
 * Da quando si guarda alla settimana dopo: il giorno (1 lunedì … 7 domenica; senza, l'ultimo
 * giorno di scuola dall'orario) e l'ora, "HH:MM". "24:00" vuol dire finito quel giorno.
 */
export interface WeekSwitch {
  day?: number
  time: string
}

/**
 * La settimana da mostrare a una data e un'ora: finita la scuola della settimana, quella dopo.
 * Senza ora, conta la fine della giornata.
 */
export function weekToShow(data: ProfclickData, date: ISODate, time = '00:00', from: WeekSwitch = { time: '24:00' }): ISODate {
  const day = from.day ?? lastSchoolDay(data)
  const next = weekday(date) > day || (weekday(date) === day && time >= from.time)
  return startOfWeek(next ? addDays(date, 7) : date)
}
