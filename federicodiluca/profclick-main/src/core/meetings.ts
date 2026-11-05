// Le riunioni del pomeriggio (ADR 0011): le cose da preparare proposte per tipo e il
// riepilogo della classe ricavato dai dati, quello che serve per consiglio e scrutinio.

import { currentPeriod, sortedCourses } from './calendar'
import { formatDay, type ISODate } from './dates'
import { periodGrades, type PeriodGrades } from './grading'
import { type Course, courseLabel, GRADE_LABELS, type GradeType, isClassMeeting, type Meeting, type MeetingKind, type MeetingPrep, meetingLabel, type Period, type ProfclickData, type SchoolYear } from './model'
import { topicProgress } from './progress'

/** I ruoli che aggiungono voci: coordinatore della classe, chi scrive il verbale. */
export interface MeetingRoles {
  coordinator: boolean
  minutes?: boolean
}

/**
 * Le voci proposte per ogni tipo di riunione: da preparare per tutti e in più per il
 * coordinatore, da fare dopo per tutti, il verbale per chi lo scrive.
 */
const DEFAULT_PREP: Record<MeetingKind, { all: string[]; coordinator: string[]; after: string[]; coordinatorAfter: string[]; minutes: string | null }> = {
  cdc: { all: ['Punti da portare al consiglio'], coordinator: ['Raccogliere le segnalazioni dei colleghi'], after: [], coordinatorAfter: [], minutes: 'Verbale del consiglio' },
  scrutinio: {
    all: ['Proposte di voto sul registro', 'Argomenti da recuperare per le insufficienze'],
    coordinator: ['Proposta del voto di comportamento', 'Giudizi'],
    after: [],
    coordinatorAfter: ['Comunicazioni alle famiglie'],
    minutes: 'Verbale dello scrutinio',
  },
  glo: { all: ['Rileggere il PEI', 'Osservazioni per la mia materia'], coordinator: ['Raccogliere le osservazioni dei colleghi'], after: [], coordinatorAfter: [], minutes: 'Verbale del GLO' },
  collegio: { all: ['Leggere i documenti della convocazione'], coordinator: [], after: [], coordinatorAfter: [], minutes: 'Verbale del collegio' },
  dipartimento: { all: ["Leggere l'ordine del giorno"], coordinator: [], after: [], coordinatorAfter: [], minutes: 'Verbale del dipartimento' },
  corso: { all: [], coordinator: [], after: ["Salvare l'attestato"], coordinatorAfter: [], minutes: null },
  altro: { all: [], coordinator: [], after: [], coordinatorAfter: [], minutes: null },
}

export function hasCoordinatorPrep(kind: MeetingKind): boolean {
  const d = DEFAULT_PREP[kind]
  return d.coordinator.length + d.coordinatorAfter.length > 0
}

/** Riunioni con un verbale, che qualcuno scrive. */
export function hasMinutes(kind: MeetingKind): boolean {
  return DEFAULT_PREP[kind].minutes !== null
}

function defaultItems(kind: MeetingKind, roles: MeetingRoles): { text: string; after: boolean }[] {
  const d = DEFAULT_PREP[kind]
  const before = roles.coordinator ? [...d.all, ...d.coordinator] : d.all
  const after = [...d.after, ...(roles.coordinator ? d.coordinatorAfter : []), ...(roles.minutes && d.minutes ? [d.minutes] : [])]
  return [...before.map((text) => ({ text, after: false })), ...after.map((text) => ({ text, after: true }))]
}

function item(text: string, after: boolean, newId: () => string): MeetingPrep {
  return { id: newId(), text, done: false, ...(after && { after: true }) }
}

/** Le voci proposte per una nuova riunione. */
export function defaultPrep(kind: MeetingKind, roles: MeetingRoles, newId: () => string): MeetingPrep[] {
  return defaultItems(kind, roles).map((d) => item(d.text, d.after, newId))
}

/**
 * Cambiando tipo o ruoli, le voci proposte che non si sono toccate lasciano il posto
 * a quelle nuove; quelle scritte a mano o già spuntate restano.
 */
export function updateDefaultPrep(
  prep: MeetingPrep[],
  from: { kind: MeetingKind } & MeetingRoles,
  to: { kind: MeetingKind } & MeetingRoles,
  newId: () => string,
): MeetingPrep[] {
  const old = new Set(defaultItems(from.kind, from).map((d) => d.text))
  const kept = prep.filter((p) => p.done || !old.has(p.text))
  const texts = new Set(kept.map((p) => p.text))
  const added = defaultItems(to.kind, to).filter((d) => !texts.has(d.text))
  return [...added.map((d) => item(d.text, d.after, newId)), ...kept]
}

/** Coordinatore di una classe? Lo dice l'ultima riunione di quella classe. */
export function wasCoordinator(data: ProfclickData, className: string): boolean {
  const last = Object.values(data.meetings)
    .filter((m) => m.className === className && hasCoordinatorPrep(m.kind))
    .sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt - b.updatedAt)
    .at(-1)
  return last?.coordinator ?? false
}

/** Scrive il verbale? Lo dice l'ultima riunione dello stesso tipo, e della stessa classe se è di classe. */
export function wroteMinutes(data: ProfclickData, kind: MeetingKind, className: string | null): boolean {
  const last = Object.values(data.meetings)
    .filter((m) => m.kind === kind && m.className === className)
    .sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt - b.updatedAt)
    .at(-1)
  return last?.minutes ?? false
}

/** Le voci da fare dopo una riunione passata e non ancora fatte: il verbale da scrivere. */
export function pendingAfter(meeting: Meeting): MeetingPrep[] {
  return meeting.prep.filter((p) => p.after && !p.done && p.text.trim())
}

/** I nomi delle classi, senza doppioni: chi ha due materie nella stessa classe va a un solo consiglio. */
export function classNames(data: ProfclickData): string[] {
  return [...new Set(sortedCourses(data).map((c) => c.className))]
}

export function sortedMeetings(data: ProfclickData): Meeting[] {
  return Object.values(data.meetings).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '99').localeCompare(b.time || '99'))
}

export function meetingsOn(data: ProfclickData, date: ISODate): Meeting[] {
  return sortedMeetings(data).filter((m) => m.date === date)
}

export interface MeetingPrepDue {
  meeting: Meeting
  item: MeetingPrep
  /** Il giorno della riunione. */
  due: ISODate
}

/** Le cose ancora da preparare per le riunioni da oggi in poi, e quelle da fare dopo le riunioni già fatte. */
export function openMeetingPrep(data: ProfclickData, today: ISODate): MeetingPrepDue[] {
  return sortedMeetings(data).flatMap((meeting) =>
    meeting.prep.filter((p) => !p.done && p.text.trim() && (p.after || meeting.date >= today)).map((item) => ({ meeting, item, due: meeting.date })),
  )
}

// --- Riepilogo della classe -------------------------------------------------------------

/** Lo scrutinio guarda il periodo appena finito; le altre riunioni quello in corso. */
export function meetingPeriod(year: SchoolYear, kind: MeetingKind, date: ISODate): Period | undefined {
  if (kind === 'scrutinio') {
    const ended = year.periods.filter((p) => p.end < date).at(-1)
    if (ended) return ended
  }
  return currentPeriod(year, date)
}

export interface CourseSummary {
  course: Course
  grades: PeriodGrades
  /** Voti pieni fatti. */
  gradesDone: number
  /** Tipi richiesti senza ancora un voto fatto. */
  typesWithoutGrade: GradeType[]
  topicsDone: number
  topicsTotal: number
  /** Argomenti del periodo non ancora svolti. */
  topicsLeft: string[]
}

export interface ClassSummary {
  period: Period
  courses: CourseSummary[]
}

export function classSummary(data: ProfclickData, meeting: Pick<Meeting, 'kind' | 'date' | 'className'>): ClassSummary | null {
  if (!data.year || !meeting.className || !isClassMeeting(meeting.kind)) return null
  const period = meetingPeriod(data.year, meeting.kind, meeting.date)
  const courses = sortedCourses(data).filter((c) => c.className === meeting.className)
  if (!period || courses.length === 0) return null

  return {
    period,
    courses: courses.map((course) => {
      const grades = periodGrades(data, course, period, meeting.date)
      const done = grades.full.filter((g) => g.done)
      const topics = topicProgress(data, course).filter((p) => p.topic.periodId === period.id)
      const left = topics.filter((p) => p.status !== 'fatto')
      return {
        course,
        grades,
        gradesDone: done.length,
        typesWithoutGrade: course.rules.required.filter((t) => !done.some((g) => g.type === t)),
        topicsDone: topics.length - left.length,
        topicsTotal: topics.length,
        topicsLeft: left.map((p) => p.topic.title),
      }
    }),
  }
}

/** Una riga per materia, da incollare negli appunti o nel verbale. */
export function summaryLine(s: CourseSummary, ended: boolean): string {
  const parts = [`${s.gradesDone} ${s.gradesDone === 1 ? 'voto fatto' : 'voti fatti'} su ${s.grades.target}`]
  if (s.typesWithoutGrade.length) parts.push(`senza voto: ${s.typesWithoutGrade.map((t) => GRADE_LABELS[t].toLowerCase()).join(', ')}`)
  if (s.topicsTotal) {
    let program = `${s.topicsDone} argomenti svolti su ${s.topicsTotal}`
    if (ended && s.topicsLeft.length) program += ` (non svolti: ${s.topicsLeft.join(', ')})`
    parts.push(program)
  }
  const civics = s.grades.civics
  if (civics.target > 0) parts.push(`educazione civica ${Math.round(civics.done * 10) / 10} ore su ${civics.target}`)
  return parts.join('; ')
}

/** Il periodo è finito alla data della riunione? Allora conta quello che non è stato fatto. */
export function periodEnded(summary: ClassSummary, date: ISODate): boolean {
  return summary.period.end < date
}

export function summaryText(meeting: Pick<Meeting, 'kind' | 'title' | 'className' | 'date'>, summary: ClassSummary): string {
  const ended = periodEnded(summary, meeting.date)
  return [
    `${meetingLabel(meeting)} del ${formatDay(meeting.date)} · ${summary.period.name}`,
    ...summary.courses.map((s) => `${courseLabel(s.course)}: ${summaryLine(s, ended)}.`),
  ].join('\n')
}
