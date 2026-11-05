// La proposta di piano (ADR 0006, rivista in ADR 0020): si scelgono gli argomenti e su quante
// settimane distribuirli, e la proposta riempie le lezioni ancora vuote di quelle settimane.
// Ogni argomento prende un numero di lezioni in proporzione ai suoi sotto-punti, almeno una,
// seguito dalle valutazioni previste per lui. Si ragiona per lezioni, non per ore. È solo una
// proposta: il docente la vede tratteggiata e decide se applicarla.

import { isAvailable, type LessonSlot, periodSlots } from './calendar'
import { addDays, type ISODate, startOfWeek } from './dates'
import { placedAssessments } from './grading'

export { assessmentTypes } from './grading'
import { type Activity, type Course, type GradeType, isMinor, type Period, type PlannedAssessment, type ProfclickData, type Topic } from './model'
import { courseTopics, topicsSinceLastAssessment } from './progress'

export interface ProposedLesson {
  date: ISODate
  hours: number
  activity: Activity
}

export interface Proposal {
  lessons: ProposedLesson[]
  /** Le settimane coperte: dal lunedì della prima alla domenica dell'ultima. */
  from: ISODate
  to: ISODate
  /** Argomenti scelti che non ci stanno nelle lezioni libere. */
  overflowTopics: Topic[]
  /** Valutazioni previste che non ci stanno. */
  overflowAssessments: number
  /** Lezioni rimaste libere nelle settimane scelte. */
  spareLessons: number
  assessments: number
}

/** Le lezioni future ancora vuote di un periodo, dove la proposta può mettere qualcosa. */
export function freeSlots(data: ProfclickData, course: Course, period: Period, today: ISODate): LessonSlot[] {
  return periodSlots(data, course, period).filter((s) => s.date >= today && isAvailable(s) && !s.lesson?.done && !s.lesson?.activities.length)
}

/** Lezioni per argomento: almeno una a testa, il resto in proporzione ai sotto-punti. */
export function shareLessons(topics: Topic[], lessons: number): number[] {
  if (topics.length === 0) return []
  const shares = topics.map(() => 1)
  const weights = topics.map((t) => Math.max(1, t.points.length))
  const total = weights.reduce((a, b) => a + b, 0)
  const rest = Math.max(0, lessons - topics.length)
  const exact = weights.map((w) => (rest * w) / total)
  exact.forEach((x, i) => (shares[i] += Math.floor(x)))
  // I resti vanno ai più grandi, a parità al primo.
  let left = lessons - shares.reduce((a, b) => a + b, 0)
  const order = exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  for (const [, i] of order) if (left-- > 0) shares[i]++
  return shares
}

let seq = 0
const proposalId = () => `prop-${Date.now().toString(36)}-${(seq++).toString(36)}`

/** Scritti e prove pratiche vogliono il posto giusto: il laboratorio per il pratico, una lezione lunga per lo scritto. */
function betterLater(type: GradeType, slot: LessonSlot, following: LessonSlot[]): boolean {
  if (type === 'pratico') return !slot.lab && following.slice(0, 2).some((s) => s.lab)
  if (type === 'scritto') return slot.hours < 2 && (following[0]?.hours ?? 0) > slot.hours
  return false
}

type Item = { kind: 'teach'; topic: Topic } | { kind: 'assess'; topic: Topic; planned: PlannedAssessment }

/**
 * Distribuisce gli argomenti scelti, nell'ordine del programma, sulle lezioni vuote delle
 * prossime settimane del periodo, a partire da quella con la prima lezione libera.
 */
export function proposeWeeks(data: ProfclickData, course: Course, period: Period, topicIds: string[], weeks: number, today: ISODate): Proposal {
  const all = freeSlots(data, course, period, today)
  const from = startOfWeek(all[0]?.date ?? (today > period.start ? today : period.start))
  const to = addDays(from, weeks * 7 - 1)
  const free = all.filter((s) => s.date <= to)

  const placed = placedAssessments(data, course.id)
  const chosen = courseTopics(data, course.id).filter((t) => topicIds.includes(t.id))
  const pending = (t: Topic) => t.assessments.filter((a) => !a.done && !placed.has(a.id))
  const need = (t: Topic) => (t.assessmentOnly || t.completed ? 0 : 1) + pending(t).length

  // Gli argomenti in coda che non ci stanno neanche con una lezione a testa restano fuori.
  const fitting = [...chosen]
  const overflowTopics: Topic[] = []
  while (fitting.length && fitting.reduce((s, t) => s + need(t), 0) > free.length) overflowTopics.unshift(fitting.pop()!)

  const teaching = fitting.filter((t) => !t.assessmentOnly && !t.completed)
  const assessCount = fitting.reduce((s, t) => s + pending(t).length, 0)
  const shares = new Map(shareLessons(teaching, free.length - assessCount).map((n, i) => [teaching[i].id, n]))
  const queue: Item[] = fitting.flatMap((topic) => [
    ...Array.from({ length: shares.get(topic.id) ?? 0 }, () => ({ kind: 'teach' as const, topic })),
    ...pending(topic).map((planned) => ({ kind: 'assess' as const, topic, planned })),
  ])

  const lessons: ProposedLesson[] = []
  const taughtSince: string[] = topicsSinceLastAssessment(data, course, free[0]?.date ?? today)
  let assessments = 0
  const place = (slot: LessonSlot, activity: Omit<Activity, 'id'>) => lessons.push({ date: slot.date, hours: slot.hours, activity: { id: proposalId(), ...activity } })

  for (let i = 0; i < free.length && queue.length; i++) {
    const slot = free[i]
    let item = queue[0]
    if (item.kind === 'assess' && betterLater(item.planned.type, slot, free.slice(i + 1))) {
      // Si aspetta il laboratorio: prima un'altra valutazione che segue subito, se va bene qui,
      // altrimenti un ripasso, tolto a una spiegazione che viene dopo.
      const swap = queue[1]
      if (swap?.kind === 'assess' && !betterLater(swap.planned.type, slot, free.slice(i + 1))) {
        queue.splice(1, 1)
        queue.unshift(swap)
        item = swap
      }
    }
    if (item.kind === 'assess' && betterLater(item.planned.type, slot, free.slice(i + 1))) {
      place(slot, { kind: 'ripasso', topicIds: [item.topic.id], text: '' })
      const later = queue.findLastIndex((q) => q.kind === 'teach' && queue.filter((x) => x.kind === 'teach' && x.topic === q.topic).length > 1)
      if (later > 0) queue.splice(later, 1)
      continue
    }
    queue.shift()
    if (item.kind === 'teach') {
      place(slot, { kind: 'spiegazione', topicIds: [item.topic.id], text: '' })
      if (!taughtSince.includes(item.topic.id)) taughtSince.push(item.topic.id)
    } else {
      const topicIds = item.topic.assessmentOnly ? [...taughtSince] : [item.topic.id]
      const { type, weight, text, id } = item.planned
      place(slot, { kind: 'verifica', topicIds, text, assessment: { type, weight, continues: false, plannedId: id } })
      if (!isMinor(item.planned)) taughtSince.length = 0
      assessments++
    }
  }

  // Gli argomenti rimasti senza neanche una lezione, perché le valutazioni hanno aspettato il laboratorio.
  for (const t of teaching) {
    if (!lessons.some((l) => l.activity.kind === 'spiegazione' && l.activity.topicIds.includes(t.id))) overflowTopics.push(t)
  }

  return {
    lessons,
    from: from > period.start ? from : period.start,
    to: to < period.end ? to : period.end,
    overflowTopics: overflowTopics.sort((a, b) => a.order - b.order),
    overflowAssessments: queue.filter((q) => q.kind === 'assess').length + overflowTopics.reduce((s, t) => s + pending(t).length, 0),
    spareLessons: free.length - lessons.length,
    assessments,
  }
}
