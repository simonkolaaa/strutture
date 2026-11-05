// Avanzamento del programma: per ogni argomento, le lezioni messe in calendario e quelle
// già svolte. Le ore di una lezione si dividono in parti uguali tra le sue attività:
// è una stima, ma basta per capire a che punto si è.

import { courseSlots, isAvailable } from './calendar'
import type { ISODate } from './dates'
import { placedAssessments } from './grading'
import { type ActivityKind, type Course, isDone, type ProfclickData, type Topic } from './model'

/** Le attività che fanno avanzare il programma. */
export const TEACHING_KINDS: ActivityKind[] = ['spiegazione', 'esercitazione', 'laboratorio', 'ripasso']

export interface TopicProgress {
  topic: Topic
  plannedHours: number
  doneHours: number
  /** Lezioni in cui compare, in calendario e già fatte. */
  plannedLessons: number
  doneLessons: number
  /** Prima e ultima lezione in cui compare. */
  firstDate?: ISODate
  lastDate?: ISODate
  status: 'da-pianificare' | 'pianificato' | 'in-corso' | 'fatto'
}

export function courseTopics(data: ProfclickData, courseId: string): Topic[] {
  return Object.values(data.topics)
    .filter((t) => t.courseId === courseId)
    .sort((a, b) => a.order - b.order)
}

export function topicProgress(data: ProfclickData, course: Course): TopicProgress[] {
  const byTopic = new Map<string, { planned: number; done: number; plannedLessons: number; doneLessons: number; first?: ISODate; last?: ISODate }>()
  for (const slot of courseSlots(data, course)) {
    const lesson = slot.lesson
    if (!lesson || !isAvailable(slot) || lesson.activities.length === 0) continue
    const share = slot.hours / lesson.activities.length
    const counted = new Set<string>()
    for (const activity of lesson.activities) {
      if (!TEACHING_KINDS.includes(activity.kind)) continue
      for (const id of activity.topicIds) {
        const entry = byTopic.get(id) ?? { planned: 0, done: 0, plannedLessons: 0, doneLessons: 0 }
        const hours = share / activity.topicIds.length
        entry.planned += hours
        if (isDone(lesson)) entry.done += hours
        if (!counted.has(id)) {
          counted.add(id)
          entry.plannedLessons++
          if (isDone(lesson)) entry.doneLessons++
        }
        entry.first ??= slot.date
        entry.last = slot.date
        byTopic.set(id, entry)
      }
    }
  }

  // Senza ore stimate (ADR 0020), un argomento è fatto quando le sue lezioni sono tutte fatte
  // e si è andati avanti: è iniziato un argomento dopo, o c'è stata una sua valutazione.
  const placed = placedAssessments(data, course.id)
  const assessed = (topic: Topic) => topic.assessments.some((a) => a.done || placed.get(a.id)?.done)
  const topics = courseTopics(data, course.id)
  return topics.map((topic, i) => {
    const entry = byTopic.get(topic.id)
    const plannedHours = entry?.planned ?? 0
    const doneHours = entry?.done ?? 0
    const plannedLessons = entry?.plannedLessons ?? 0
    const doneLessons = entry?.doneLessons ?? 0
    const movedOn = topics.slice(i + 1).some((t) => (byTopic.get(t.id)?.doneLessons ?? 0) > 0) || assessed(topic)
    const finished = topic.assessmentOnly
      ? topic.assessments.length > 0 && topic.assessments.every((a) => a.done || placed.get(a.id)?.done)
      : plannedLessons > 0 && doneLessons >= plannedLessons && movedOn
    const status: TopicProgress['status'] =
      topic.completed || finished ? 'fatto' : doneLessons > 0 ? 'in-corso' : plannedLessons > 0 || (topic.assessmentOnly && topic.assessments.some((a) => placed.has(a.id))) ? 'pianificato' : 'da-pianificare'
    return { topic, plannedHours, doneHours, plannedLessons, doneLessons, firstDate: entry?.first, lastDate: entry?.last, status }
  })
}

/** "3 fatti, 1 in corso su 8 argomenti": le prove senza lezioni non contano. */
export function programLine(progress: TopicProgress[]): string {
  const topics = progress.filter((p) => !p.topic.assessmentOnly)
  const done = topics.filter((p) => p.status === 'fatto').length
  const ongoing = topics.filter((p) => p.status === 'in-corso').length
  const parts = [`${done} ${done === 1 ? 'fatto' : 'fatti'}`, ...(ongoing > 0 ? [`${ongoing} in corso`] : [])]
  return `${parts.join(', ')} su ${topics.length} ${topics.length === 1 ? 'argomento' : 'argomenti'}`
}

/**
 * L'argomento su cui si sta lavorando a una data: quello dell'ultima lezione pianificata
 * prima, o il primo non concluso. Serve a precompilare le scelte.
 */
export function topicAround(data: ProfclickData, course: Course, date: ISODate): Topic | undefined {
  const slots = courseSlots(data, course, undefined, date).reverse()
  for (const slot of slots) {
    const activity = slot.lesson?.activities.find((a) => TEACHING_KINDS.includes(a.kind) && a.topicIds.length > 0)
    if (activity) return data.topics[activity.topicIds.at(-1)!]
  }
  return topicProgress(data, course).find((p) => p.status !== 'fatto')?.topic
}

/** Gli argomenti trattati dopo l'ultima valutazione piena: quelli da verificare. */
export function topicsSinceLastAssessment(data: ProfclickData, course: Course, date: ISODate): string[] {
  const slots = courseSlots(data, course, undefined, date).filter((s) => s.date < date)
  const ids: string[] = []
  for (const slot of slots.reverse()) {
    const activities = slot.lesson?.activities ?? []
    if (activities.some((a) => a.kind === 'verifica' && a.assessment && a.assessment.weight >= 100 && !a.assessment.continues)) break
    for (const a of activities) {
      if (TEACHING_KINDS.includes(a.kind)) for (const id of a.topicIds) if (!ids.includes(id)) ids.unshift(id)
    }
  }
  return ids
}
