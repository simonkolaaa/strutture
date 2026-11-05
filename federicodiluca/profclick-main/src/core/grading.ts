// I voti che servono in un periodo e quanti ne sono già previsti (ADR 0005). ProfClick non
// conosce i voti dei singoli studenti: conta le valutazioni della classe, cioè le occasioni
// in cui ognuno prende un voto.

import { isAvailable, periodSlots } from './calendar'
import type { ISODate } from './dates'
import { type Activity, type Course, type GradeType, isDone, isMinor, type Period, type PlannedAssessment, type ProfclickData, type Topic, weeklyHours } from './model'

export interface GradeEvent {
  /** null per una valutazione segnata come fatta dal programma, senza lezione. */
  date: ISODate | null
  activity: Activity
  type: GradeType
  weight: number
  done: boolean
  /** Le lezioni dopo in cui prosegue (il giro di interrogazioni) o si recupera: sempre lo stesso voto. */
  parts: { date: ISODate; activity: Activity }[]
}

export interface PeriodGrades {
  /** Voti pieni richiesti nel periodo. */
  target: number
  /** Valutazioni piene in calendario (fatte o no) o spuntate nel programma, escluse le prosecuzioni. */
  full: GradeEvent[]
  minor: GradeEvent[]
  done: number
  /** Valutazioni previste nel programma e non ancora in calendario. */
  unplaced: { topic: Topic; planned: PlannedAssessment }[]
  /** Voti pieni ancora da mettere in calendario. */
  missing: number
  /** Tipi richiesti che non compaiono ancora nel piano. */
  missingTypes: GradeType[]
  /** Lezioni e ore da oggi alla fine del periodo, escluse quelle annullate. */
  remainingLessons: number
  remainingHours: number
  /** Lezioni future ancora vuote, dove si può mettere qualcosa. */
  freeLessons: number
  civics: { target: number; planned: number; done: number }
  status: 'ok' | 'da-pianificare' | 'a-rischio'
}

/**
 * I tipi di valutazione da aggiungere: prima quelli richiesti e mancanti, poi a rotazione,
 * scegliendo il tipo finora meno usato.
 */
export function assessmentTypes(course: Course, existing: GradeType[], count: number): GradeType[] {
  const used = { scritto: 0, teorico: 0, pratico: 0 }
  for (const t of existing) used[t]++
  const result: GradeType[] = []
  for (const t of course.rules.required) {
    if (result.length < count && used[t] === 0) {
      result.push(t)
      used[t]++
    }
  }
  const rotation = course.rules.required.length > 0 ? course.rules.required : (['scritto', 'teorico', 'pratico'] as GradeType[])
  while (result.length < count) {
    const next = [...rotation].sort((a, b) => used[a] - used[b])[0]
    result.push(next)
    used[next]++
  }
  return result
}

export function targetGrades(course: Course): number {
  return course.rules.perPeriod ?? Math.max(weeklyHours(course), course.rules.required.length)
}

/**
 * Le valutazioni previste già messe in calendario, con la lezione in cui cadono. Quelle della
 * proposta portano il collegamento; una verifica aggiunta a mano nella lezione si abbina da sola
 * alla prima prevista ancora libera del suo argomento, dello stesso tipo e, se c'è, dello stesso
 * peso (pieno o minore). Così un orale messo in calendario non resta anche "da mettere".
 */
export function placedAssessments(data: ProfclickData, courseId: string): Map<string, { date: ISODate; done: boolean }> {
  const placed = new Map<string, { date: ISODate; done: boolean }>()
  const lessons = Object.values(data.lessons)
    .filter((l) => l.courseId === courseId && !l.cancelled && !l.removed)
    .sort((a, b) => a.date.localeCompare(b.date))
  const loose: { activity: Activity; at: { date: ISODate; done: boolean } }[] = []
  for (const lesson of lessons) {
    const at = { date: lesson.date, done: isDone(lesson) }
    for (const activity of lesson.activities) {
      const a = activity.assessment
      if (!a || activity.kind !== 'verifica' || a.continues) continue
      if (a.plannedId) placed.set(a.plannedId, at)
      else loose.push({ activity, at })
    }
  }
  for (const { activity, at } of loose) {
    const a = activity.assessment!
    const candidates = activity.topicIds
      .flatMap((id) => data.topics[id]?.assessments ?? [])
      .filter((p) => p.type === a.type && !p.done && !placed.has(p.id))
    const match = candidates.find((p) => isMinor(p) === isMinor(a)) ?? candidates[0]
    if (match) placed.set(match.id, at)
  }
  return placed
}

export function periodGrades(data: ProfclickData, course: Course, period: Period, today: ISODate): PeriodGrades {
  const slots = periodSlots(data, course, period).filter(isAvailable)
  const full: GradeEvent[] = []
  const minor: GradeEvent[] = []
  const civics = { target: course.civics[period.id] ?? 0, planned: 0, done: 0 }
  // Ogni prosecuzione va alla valutazione che ripete, o all'ultima dello stesso tipo, o all'ultima.
  const owners = new Map<string, GradeEvent>()
  const lastOfType = new Map<GradeType, GradeEvent>()
  let last: GradeEvent | undefined

  for (const slot of slots) {
    const activities = slot.lesson?.activities ?? []
    for (const activity of activities) {
      if (activity.kind === 'civica') {
        const hours = slot.hours / activities.length
        civics.planned += hours
        if (isDone(slot.lesson)) civics.done += hours
      }
      const a = activity.assessment
      if (activity.kind !== 'verifica' || !a) continue
      if (a.continues) {
        const owner = (activity.repeatOf && owners.get(activity.repeatOf)) || lastOfType.get(a.type) || last
        if (owner) {
          owner.parts.push({ date: slot.date, activity })
          owners.set(activity.id, owner)
        }
        continue
      }
      const event: GradeEvent = { date: slot.date, activity, type: a.type, weight: a.weight, done: isDone(slot.lesson), parts: [] }
      ;(isMinor(a) ? minor : full).push(event)
      owners.set(activity.id, event)
      lastOfType.set(a.type, event)
      last = event
    }
  }

  // Le valutazioni previste nel programma di questo periodo e non messe in calendario in
  // nessun periodo (una verifica slittata al periodo dopo resta collocata): quelle spuntate
  // come fatte contano, senza data; le altre sono ancora da collocare.
  const placed = placedAssessments(data, course.id)
  const unplaced: PeriodGrades['unplaced'] = []
  const periodTopics = Object.values(data.topics)
    .filter((t) => t.courseId === course.id && t.periodId === period.id)
    .sort((a, b) => a.order - b.order)
  for (const topic of periodTopics) {
    for (const planned of topic.assessments) {
      if (placed.has(planned.id)) continue
      if (!planned.done) {
        unplaced.push({ topic, planned })
        continue
      }
      const assessment = { type: planned.type, weight: planned.weight, continues: false, plannedId: planned.id }
      const activity: Activity = { id: planned.id, kind: 'verifica', topicIds: [topic.id], text: planned.text, assessment }
      ;(isMinor(planned) ? minor : full).push({ date: null, activity, type: planned.type, weight: planned.weight, done: true, parts: [] })
    }
  }

  const target = targetGrades(course)
  const upcoming = slots.filter((s) => s.date >= today && !isDone(s.lesson, today))
  const missing = Math.max(0, target - full.length)
  const missingTypes = course.rules.required.filter((t) => !full.some((g) => g.type === t))
  const freeLessons = upcoming.filter((s) => !s.lesson?.activities.length).length
  const civicsMissing = civics.planned < civics.target - 0.01
  // Non basta che ci sia posto: servono abbastanza lezioni libere anche per spiegare.
  const needed = Math.max(missing, missingTypes.length) + (civicsMissing ? 1 : 0)
  const status = needed === 0 ? 'ok' : freeLessons >= needed * 2 ? 'da-pianificare' : 'a-rischio'

  return {
    target,
    full,
    minor,
    done: full.filter((g) => g.done).length,
    unplaced,
    missing,
    missingTypes,
    remainingLessons: upcoming.length,
    remainingHours: upcoming.reduce((sum, s) => sum + s.hours, 0),
    freeLessons,
    civics,
    status,
  }
}

/** Un voto ancora da dare nel periodo: in calendario, previsto nel programma, o che manca al minimo. */
export interface NextGrade {
  type: GradeType
  weight: number
  /** L'argomento, o gli argomenti trattati, su cui verte; vuoto se non si sa ancora. */
  about: string
  text: string
  /** La lezione in cui è, se è già in calendario. */
  date: ISODate | null
  source: 'calendario' | 'programma' | 'minimo'
}

/** I voti ancora da dare, nell'ordine in cui verranno: prima quelli in calendario, poi il resto. */
export function nextGrades(data: ProfclickData, course: Course, grades: PeriodGrades): NextGrade[] {
  const titles = (ids: string[]) => ids.map((id) => data.topics[id]?.title).filter(Boolean).join(', ')
  const planned = new Map(Object.values(data.topics).flatMap((t) => t.assessments.map((a) => [a.id, t] as const)))
  const placed = [...grades.full, ...grades.minor]
    .filter((g) => g.date && !g.done)
    .sort((a, b) => a.date!.localeCompare(b.date!))
    .map((g): NextGrade => {
      const topic = g.activity.assessment?.plannedId ? planned.get(g.activity.assessment.plannedId) : undefined
      const about = topic && !topic.assessmentOnly ? topic.title : titles(g.activity.topicIds) || topic?.title || ''
      return { type: g.type, weight: g.weight, about, text: g.activity.text, date: g.date, source: 'calendario' }
    })
  const fromProgram = grades.unplaced.map(({ topic, planned }): NextGrade => ({ type: planned.type, weight: planned.weight, about: topic.title, text: planned.text, date: null, source: 'programma' }))
  // Quelli che mancano al minimo anche contando le valutazioni previste nel programma.
  const existing = [...grades.full.map((g) => g.type), ...grades.unplaced.filter((u) => !isMinor(u.planned)).map((u) => u.planned.type)]
  const missingTypes = course.rules.required.filter((t) => !existing.includes(t)).length
  const extra = assessmentTypes(course, existing, Math.max(grades.target - existing.length, missingTypes, 0))
  const toMinimum = extra.map((type): NextGrade => ({ type, weight: 100, about: '', text: '', date: null, source: 'minimo' }))
  return [...placed, ...fromProgram, ...toMinimum]
}

/** Le valutazioni previste nel programma del periodo: quante sono e quante ancora senza data. */
export function programAssessments(data: ProfclickData, course: Course, period: Period, grades: PeriodGrades): { total: number; unplaced: number } {
  const total = Object.values(data.topics)
    .filter((t) => t.courseId === course.id && t.periodId === period.id)
    .reduce((sum, t) => sum + t.assessments.length, 0)
  return { total, unplaced: grades.unplaced.length }
}
